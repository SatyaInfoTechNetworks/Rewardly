const express = require('express');
const router = express.Router();
const Offer = require('../models/Offer');
const OfferTier = require('../models/OfferTier');
const UserOfferProgress = require('../models/UserOfferProgress');
const OfferCompletion = require('../models/OfferCompletion');
const User = require('../models/User');
const { Op } = require('sequelize');
const crypto = require('crypto');

/**
 * GET /api/offers
 * List active geotargeted offers, excluding completed ones
 */
router.get('/', async (req, res) => {
  try {
    const { user_id, country = 'IN', category, search } = req.query;

    let whereClause = { is_active: true };

    if (category && category !== 'All') {
      whereClause.category = category;
    }

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    // Geotargeting filtering
    if (country) {
      whereClause.country_targeting = {
        [Op.or]: [
          '*',
          country,
          { [Op.like]: `%${country}%` }
        ]
      };
    }

    // Exclude completed offers if user_id is provided
    let completedOfferIds = [];
    if (user_id) {
      const completedProgress = await UserOfferProgress.findAll({
        where: {
          user_id,
          [Op.or]: [
            { status: 'COMPLETED' },
            { admin_status: 'APPROVED' }
          ]
        },
        attributes: ['offer_id']
      });
      completedOfferIds = completedProgress.map(p => p.offer_id);
      
      if (completedOfferIds.length > 0) {
        whereClause.id = { [Op.notIn]: completedOfferIds };
      }
    }

    const offers = await Offer.findAll({
      where: whereClause,
      include: [{
        model: OfferTier,
        as: 'tiers',
        where: { status: 'ACTIVE' },
        required: false
      }],
      order: [['is_hot', 'DESC'], ['created_at', 'DESC']]
    });

    // Map to Dual-Casing format
    const formattedOffers = offers.map(offer => {
      const plain = offer.get({ plain: true });
      const completionsToday = 0; // In production this would query stats
      const isCapped = plain.daily_completion_cap > 0 && completionsToday >= plain.daily_completion_cap;

      return {
        id: plain.id,
        external_id: plain.external_id,
        title: plain.title,
        description: plain.description,
        category: plain.category,
        iconUrl: plain.icon_url,
        icon_url: plain.icon_url,
        trackingUrl: plain.tracking_url,
        tracking_url: plain.tracking_url,
        totalReward: parseFloat(plain.total_reward),
        total_reward: parseFloat(plain.total_reward),
        actualPrice: parseFloat(plain.actual_price),
        actual_price: parseFloat(plain.actual_price),
        type: plain.type,
        inputType: plain.input_type,
        input_type: plain.input_type,
        inputInstruction: plain.input_instruction,
        input_instruction: plain.input_instruction,
        rewardType: plain.reward_type,
        reward_type: plain.reward_type,
        extraLabel: plain.extra_label,
        extra_label: plain.extra_label,
        estimatedTime: plain.estimated_time,
        estimated_time: plain.estimated_time,
        difficulty: plain.difficulty,
        dailyCompletionCap: plain.daily_completion_cap,
        daily_completion_cap: plain.daily_completion_cap,
        countryTargeting: plain.country_targeting,
        country_targeting: plain.country_targeting,
        isCompleted: false,
        completionsToday,
        isCapped,
        tiers: (plain.tiers || []).sort((a,b) => a.sequence - b.sequence).map(t => ({
          id: t.id,
          title: t.title,
          backend_title: t.tier_title,
          tier_title: t.tier_title,
          app_tier_title: t.app_tier_title,
          reward: parseFloat(t.reward),
          status: t.status,
          steps: t.steps,
          sequence: t.sequence
        }))
      };
    });

    res.json({ success: true, offers: formattedOffers });
  } catch (err) {
    console.error('[GET /api/offers] Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/offers/history
 * List of user offer clicks logs and completions
 */
router.get('/history', async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ success: false, error: 'Missing user_id parameter' });
    }

    const progressLogs = await UserOfferProgress.findAll({
      where: { user_id },
      include: [{
        model: Offer,
        attributes: ['title', 'icon_url', 'total_reward']
      }],
      order: [['updated_at', 'DESC']]
    });

    const formattedHistory = progressLogs.map(p => {
      const plain = p.get({ plain: true });
      const completedTiers = plain.completed_tiers ? JSON.parse(plain.completed_tiers) : [];

      let statusText = 'Started';
      if (plain.status === 'COMPLETED') {
        statusText = 'Completed';
      } else if (plain.admin_status === 'APPROVED') {
        statusText = 'Approved';
      } else if (plain.admin_status === 'REJECTED') {
        statusText = 'Rejected';
      } else if (plain.admin_status === 'PENDING' && plain.user_input) {
        statusText = 'Verification Pending';
      }

      return {
        clickId: plain.click_id,
        click_id: plain.click_id,
        offerId: plain.offer_id,
        offer_id: plain.offer_id,
        title: plain.Offer?.title || 'Unknown Offer',
        iconUrl: plain.Offer?.icon_url || '',
        icon_url: plain.Offer?.icon_url || '',
        totalReward: parseFloat(plain.Offer?.total_reward || 0),
        total_reward: parseFloat(plain.Offer?.total_reward || 0),
        status: plain.status,
        adminStatus: plain.admin_status,
        admin_status: plain.admin_status,
        statusText,
        status_text: statusText,
        completedTiersCount: completedTiers.length,
        completed_tiers_count: completedTiers.length,
        completedTiers,
        completed_tiers: completedTiers,
        lastUpdated: plain.updated_at,
        last_updated: plain.updated_at
      };
    });

    res.json({ success: true, history: formattedHistory });
  } catch (err) {
    console.error('[GET /api/offers/history] Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/offers/:id
 * Retrieve details for a single offer
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.query;

    const offer = await Offer.findByPk(id, {
      include: [{
        model: OfferTier,
        as: 'tiers',
        where: { status: 'ACTIVE' },
        required: false
      }]
    });

    if (!offer) {
      return res.status(404).json({ success: false, error: 'Offer not found' });
    }

    const plainOffer = offer.get({ plain: true });

    let userProgress = null;
    if (user_id) {
      userProgress = await UserOfferProgress.findOne({
        where: { user_id, offer_id: id }
      });
    }

    let isCompleted = false;
    let adminStatus = null;
    let userInput = null;
    let rejectionReason = null;
    let clickId = null;

    if (userProgress) {
      isCompleted = userProgress.status === 'COMPLETED' || userProgress.admin_status === 'APPROVED';
      adminStatus = userProgress.admin_status;
      clickId = userProgress.click_id;
      userInput = userProgress.user_input ? JSON.parse(userProgress.user_input) : null;
      rejectionReason = userProgress.admin_status === 'REJECTED' ? userProgress.admin_remark : null;
    }

    const completedTiersList = userProgress?.completed_tiers ? JSON.parse(userProgress.completed_tiers) : [];
    const formattedTiers = (plainOffer.tiers || []).sort((a,b) => a.sequence - b.sequence).map(t => {
      const isTierCompleted = completedTiersList.some(ct => ct.title === t.title || ct.title === t.tier_title);
      return {
        id: t.id,
        title: t.title,
        backend_title: t.tier_title,
        tier_title: t.tier_title,
        app_tier_title: t.app_tier_title,
        reward: parseFloat(t.reward),
        status: t.status,
        steps: t.steps,
        sequence: t.sequence,
        is_completed: isTierCompleted,
        isCompleted: isTierCompleted
      };
    });

    const formattedOffer = {
      id: plainOffer.id,
      title: plainOffer.title,
      description: plainOffer.description,
      iconUrl: plainOffer.icon_url,
      icon_url: plainOffer.icon_url,
      trackingUrl: plainOffer.tracking_url,
      tracking_url: plainOffer.tracking_url,
      totalReward: parseFloat(plainOffer.total_reward),
      total_reward: parseFloat(plainOffer.total_reward),
      actualPrice: parseFloat(plainOffer.actual_price),
      actual_price: parseFloat(plainOffer.actual_price),
      type: plainOffer.type,
      inputType: plainOffer.input_type,
      input_type: plainOffer.input_type,
      inputInstruction: plainOffer.input_instruction,
      input_instruction: plainOffer.input_instruction,
      rewardType: plainOffer.reward_type,
      reward_type: plainOffer.reward_type,
      extraLabel: plainOffer.extra_label,
      extra_label: plainOffer.extra_label,
      estimatedTime: plainOffer.estimated_time,
      estimated_time: plainOffer.estimated_time,
      difficulty: plainOffer.difficulty,
      dailyCompletionCap: plainOffer.daily_completion_cap,
      daily_completion_cap: plainOffer.daily_completion_cap,
      countryTargeting: plainOffer.country_targeting,
      country_targeting: plainOffer.country_targeting,
      
      click_id: clickId,
      clickId: clickId,
      isCompleted,
      adminStatus,
      admin_status: adminStatus,
      userInput,
      user_input: userInput,
      rejectionReason,
      rejection_reason: rejectionReason,
      tiers: formattedTiers
    };

    res.json({ success: true, offer: formattedOffer });
  } catch (err) {
    console.error('[GET /api/offers/:id] Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/offers/start
 * Logs the click logging starting point of the offer
 */
router.post('/start', async (req, res) => {
  try {
    const { user_id, offer_id, gaid = '', device_model = '' } = req.body;

    if (!user_id || !offer_id) {
      return res.status(400).json({ success: false, error: 'Missing user_id or offer_id' });
    }

    const offer = await Offer.findByPk(offer_id);
    if (!offer) {
      return res.status(404).json({ success: false, error: 'Offer not found' });
    }

    const clickId = crypto.randomUUID();

    let progress = await UserOfferProgress.findOne({
      where: { user_id, offer_id }
    });

    if (progress) {
      await progress.update({
        click_id: clickId,
        status: 'STARTED',
        admin_status: 'PENDING',
        admin_remark: null
      });
    } else {
      progress = await UserOfferProgress.create({
        user_id,
        offer_id,
        click_id: clickId,
        status: 'STARTED',
        admin_status: 'PENDING',
        completed_tiers: JSON.stringify([])
      });
    }

    // Resolve URL placeholders
    let trackingUrl = offer.tracking_url || '';
    if (trackingUrl) {
      trackingUrl = trackingUrl.replace(/{click_id}/g, clickId)
                               .replace(/{clickId}/g, clickId)
                               .replace(/{TRANS_ID}/g, clickId)
                               .replace(/{trans_id}/g, clickId);

      trackingUrl = trackingUrl.replace(/{user_id}/g, user_id.toString())
                               .replace(/{userId}/g, user_id.toString())
                               .replace(/{USER_ID}/g, user_id.toString())
                               .replace(/{UID}/g, user_id.toString())
                               .replace(/{uid}/g, user_id.toString());

      trackingUrl = trackingUrl.replace(/{gaid}/g, gaid)
                               .replace(/{GAID}/g, gaid)
                               .replace(/{ad_id}/g, gaid)
                               .replace(/{AD_ID}/g, gaid)
                               .replace(/{guid}/g, gaid)
                               .replace(/{GUID}/g, gaid);

      trackingUrl = trackingUrl.replace(/{device_model}/g, encodeURIComponent(device_model))
                               .replace(/{DEVICE_MODEL}/g, encodeURIComponent(device_model));
    }

    res.json({
      success: true,
      message: 'Offer started successfully',
      click_id: clickId,
      clickId: clickId,
      url: trackingUrl
    });
  } catch (err) {
    console.error('[POST /api/offers/start] Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/offers/submit-proof
 * Submit manual answers or screenshots for manual offline offers verification
 */
router.post('/submit-proof', async (req, res) => {
  try {
    const { click_id, input_data } = req.body;

    if (!click_id || !input_data) {
      return res.status(400).json({ success: false, error: 'Missing click_id or input_data' });
    }

    const progress = await UserOfferProgress.findOne({
      where: { click_id }
    });

    if (!progress) {
      return res.status(404).json({ success: false, error: 'Offer progress session not found for this click ID' });
    }

    await progress.update({
      user_input: JSON.stringify(input_data),
      admin_status: 'PENDING'
    });

    res.json({
      success: true,
      message: 'Proof submitted successfully'
    });
  } catch (err) {
    console.error('[POST /api/offers/submit-proof] Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});


module.exports = router;
