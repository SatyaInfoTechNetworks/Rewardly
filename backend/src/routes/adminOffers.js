const express = require('express');
const router = express.Router();
const Offer = require('../models/Offer');
const OfferTier = require('../models/OfferTier');
const UserOfferProgress = require('../models/UserOfferProgress');
const OfferCompletion = require('../models/OfferCompletion');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { sequelize } = require('../config/database');
const { adminAuth } = require('../middlewares/adminAuth');
const { trackContestActivity } = require('../utils/contestTracker');
const { validateReferral } = require('../utils/referralValidator');
const axios = require('axios');

const BOT_TOKEN = '8441190461:AAErfv2dgLp7DiWuo85RmnFL7AS3HwHu1W0';

/**
 * GET /api/admin/offers
 * List all offers + completions statistics + tier count
 */
router.get('/offers', adminAuth, async (req, res) => {
  try {
    const offers = await Offer.findAll({
      include: [{
        model: OfferTier,
        as: 'tiers',
        required: false
      }],
      order: [['created_at', 'DESC']]
    });

    const formattedOffers = await Promise.all(offers.map(async offer => {
      const plain = offer.get({ plain: true });

      // Get count of completions
      const completionsCount = await UserOfferProgress.count({
        where: {
          offer_id: plain.id,
          [sequelize.Sequelize.Op.or]: [
            { status: 'COMPLETED' },
            { admin_status: 'APPROVED' }
          ]
        }
      });

      return {
        ...plain,
        completions_count: completionsCount,
        completion_count: completionsCount,
        tiers_count: (plain.tiers || []).length
      };
    }));

    res.json(formattedOffers);
  } catch (err) {
    console.error('[Admin GET /offers] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/offers
 * Create new custom offer with associated milestones/tiers
 */
router.post('/offers', adminAuth, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { tiers, ...offerData } = req.body;

    // Setting is_hot to true automatically resets all other hot offers
    if (offerData.is_hot) {
      await Offer.update({ is_hot: false }, { where: { is_hot: true }, transaction: t });
    }

    const offer = await Offer.create(offerData, { transaction: t });

    if (tiers && tiers.length > 0) {
      const formattedTiers = tiers.map(tier => ({
        ...tier,
        offer_id: offer.id,
        tier_title: tier.backend_title || tier.tier_title,
        app_tier_title: tier.app_tier_title || tier.title
      }));

      await OfferTier.bulkCreate(formattedTiers, { transaction: t });
    }

    await t.commit();
    res.status(201).json(offer);
  } catch (err) {
    await t.rollback();
    console.error('[Admin POST /offers] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/admin/offers/:id
 * Update custom offer and synchronize its tiers atomically
 */
router.put('/offers/:id', adminAuth, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { tiers, ...offerData } = req.body;

    const offer = await Offer.findByPk(id, { transaction: t });
    if (!offer) {
      await t.rollback();
      return res.status(404).json({ error: 'Offer not found' });
    }

    // Setting is_hot to true automatically resets all other hot offers
    if (offerData.is_hot && !offer.is_hot) {
      await Offer.update({ is_hot: false }, { where: { is_hot: true }, transaction: t });
    }

    await offer.update(offerData, { transaction: t });

    // Sync tiers: delete existing and re-insert sequence
    await OfferTier.destroy({ where: { offer_id: id }, transaction: t });

    if (tiers && tiers.length > 0) {
      const formattedTiers = tiers.map((tier, index) => ({
        ...tier,
        offer_id: id,
        sequence: tier.sequence || (index + 1),
        tier_title: tier.backend_title || tier.tier_title,
        app_tier_title: tier.app_tier_title || tier.title
      }));
      await OfferTier.bulkCreate(formattedTiers, { transaction: t });
    }

    await t.commit();
    res.json({ success: true, message: 'Offer updated successfully' });
  } catch (err) {
    await t.rollback();
    console.error('[Admin PUT /offers/:id] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/admin/offers/:id
 * Delete custom offer and cascade records
 */
router.delete('/offers/:id', adminAuth, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const offer = await Offer.findByPk(id, { transaction: t });
    if (!offer) {
      await t.rollback();
      return res.status(404).json({ error: 'Offer not found' });
    }

    await offer.destroy({ transaction: t });
    await t.commit();
    res.json({ success: true, message: 'Offer deleted successfully' });
  } catch (err) {
    await t.rollback();
    console.error('[Admin DELETE /offers/:id] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/proofs
 * Retrieve pending offline user proofs submissions
 */
router.get('/proofs', adminAuth, async (req, res) => {
  try {
    const pendingProofs = await UserOfferProgress.findAll({
      where: {
        admin_status: 'PENDING',
        user_input: {
          [sequelize.Sequelize.Op.ne]: null
        }
      },
      include: [
        {
          model: Offer,
          attributes: ['title', 'total_reward', 'input_type', 'input_instruction']
        }
      ],
      order: [['updated_at', 'ASC']]
    });

    const formattedProofs = await Promise.all(pendingProofs.map(async proof => {
      const plain = proof.get({ plain: true });

      // Retrieve User Info from the Users table using user_id
      const user = await User.findByPk(plain.user_id);

      return {
        clickId: plain.click_id,
        click_id: plain.click_id,
        user_id: plain.user_id,
        offer_id: plain.offer_id,
        status: plain.status,
        admin_status: plain.admin_status,
        adminStatus: plain.admin_status,
        user_input: plain.user_input ? JSON.parse(plain.user_input) : null,
        userInput: plain.user_input ? JSON.parse(plain.user_input) : null,
        lastUpdated: plain.updated_at,
        last_updated: plain.updated_at,
        Offer: plain.Offer,
        User: user ? {
          first_name: user.first_name,
          username: user.username,
          balance: user.balance
        } : {
          first_name: 'Unknown Player',
          username: 'unknown',
          balance: 0
        }
      };
    }));

    res.json(formattedProofs);
  } catch (err) {
    console.error('[Admin GET /proofs] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/proofs/:clickId/approve
 * Approve manual proof submission and credit coins
 */
router.post('/proofs/:clickId/approve', adminAuth, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { clickId } = req.params;

    const progress = await UserOfferProgress.findOne({
      where: { click_id: clickId },
      transaction: t
    });

    if (!progress) {
      await t.rollback();
      return res.status(404).json({ error: 'Progress record not found' });
    }

    if (progress.admin_status === 'APPROVED') {
      await t.rollback();
      return res.status(400).json({ error: 'This proof was already approved' });
    }

    const offer = await Offer.findByPk(progress.offer_id, { transaction: t });
    if (!offer) {
      await t.rollback();
      return res.status(404).json({ error: 'Offer not found' });
    }

    const user = await User.findByPk(progress.user_id, { transaction: t });
    if (!user) {
      await t.rollback();
      return res.status(404).json({ error: 'User not found' });
    }

    const rewardAmount = Math.floor(parseFloat(offer.total_reward));

    // 1. Update wallet balance
    await user.update({ balance: user.balance + rewardAmount }, { transaction: t });

    // 2. Create double-entry ledger Transaction record
    await Transaction.create({
      telegram_id: user.telegram_id,
      amount: rewardAmount,
      type: 'offerwall',
      description: `Task Approved: "${offer.title}"`,
      reference_id: clickId,
      external_id: clickId,
      status: 'completed'
    }, { transaction: t });

    // 3. Mark progress as COMPLETED and APPROVED
    await progress.update({
      admin_status: 'APPROVED',
      status: 'COMPLETED',
      admin_remark: 'Approved by Admin'
    }, { transaction: t });

    // 4. Register completion statistics
    await OfferCompletion.create({
      user_id: user.telegram_id,
      offer_id: offer.id,
      click_id: clickId,
      reward_coins: rewardAmount
    }, { transaction: t });

    await t.commit();

    // 5. Post-reward processing (Contest Leaderboards and referrals check)
    try {
      await trackContestActivity(user.telegram_id, 'earnings', rewardAmount);
      await validateReferral(user.telegram_id);
    } catch (postErr) {
      console.error('[Admin Approve] Post-reward processing error:', postErr.message);
    }

    // 6. Send push notification alert using Telegram Bot
    try {
      const message = `🎉 <b>Task Approved!</b>\n\nYour submitted proof for the manual task <b>"${offer.title}"</b> has been successfully approved!\n💰 <b>+${rewardAmount} Coins</b> credited to your wallet balance.`;
      await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        chat_id: user.telegram_id.toString(),
        text: message,
        parse_mode: 'HTML'
      });
    } catch (tgErr) {
      console.warn('⚠️ Could not send Telegram notification to user:', tgErr.message);
    }

    res.json({ success: true, message: 'Proof approved and user credited successfully' });
  } catch (err) {
    await t.rollback();
    console.error('[Admin POST /proofs/:clickId/approve] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/proofs/:clickId/reject
 * Reject user offline proof submission
 */
router.post('/proofs/:clickId/reject', adminAuth, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { clickId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      await t.rollback();
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const progress = await UserOfferProgress.findOne({
      where: { click_id: clickId },
      transaction: t
    });

    if (!progress) {
      await t.rollback();
      return res.status(404).json({ error: 'Progress record not found' });
    }

    const offer = await Offer.findByPk(progress.offer_id, { transaction: t });
    const user = await User.findByPk(progress.user_id, { transaction: t });

    // Update status
    await progress.update({
      admin_status: 'REJECTED',
      admin_remark: reason
    }, { transaction: t });

    await t.commit();

    // Send Rejection Alert Notification
    if (user && offer) {
      try {
        const message = `⚠️ <b>Task Proof Rejected</b>\n\nYour proof for the task <b>"${offer.title}"</b> was rejected.\n🚨 <b>Reason:</b> ${reason}\n\nPlease read instructions and re-submit valid proof if applicable.`;
        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          chat_id: user.telegram_id.toString(),
          text: message,
          parse_mode: 'HTML'
        });
      } catch (tgErr) {
        console.warn('⚠️ Could not send Telegram notification to user:', tgErr.message);
      }
    }

    res.json({ success: true, message: 'Proof rejected successfully' });
  } catch (err) {
    await t.rollback();
    console.error('[Admin POST /proofs/:clickId/reject] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
