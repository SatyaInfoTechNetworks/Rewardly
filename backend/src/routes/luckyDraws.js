const express = require('express');
const router = express.Router();
const LuckyDraw = require('../models/LuckyDraw');
const LuckyDrawEntry = require('../models/LuckyDrawEntry');
const LuckyDrawWinner = require('../models/LuckyDrawWinner');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { validateTelegramInitData } = require('../utils/telegramAuth');
const { sequelize } = require('../config/database');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/**
 * GET /api/lucky-draws
 * List active, upcoming, and recently ended draws
 */
router.get('/', async (req, res) => {
  try {
    const draws = await LuckyDraw.findAll({
      where: {
        status: ['active', 'upcoming', 'ended']
      },
      order: [
        [sequelize.literal("CASE WHEN status = 'active' THEN 1 WHEN status = 'upcoming' THEN 2 ELSE 3 END"), 'ASC'],
        ['end_time', 'ASC']
      ],
      limit: 30
    });

    const enrichedDraws = await Promise.all(draws.map(async (draw) => {
      const entriesCount = await LuckyDrawEntry.count({ where: { lucky_draw_id: draw.id } });
      const uniqueParticipants = await LuckyDrawEntry.count({
        where: { lucky_draw_id: draw.id },
        distinct: true,
        col: 'user_id'
      });

      return {
        ...draw.toJSON(),
        entriesCount,
        participantsCount: uniqueParticipants
      };
    }));

    res.json(enrichedDraws);
  } catch (err) {
    console.error("Fetch LuckyDraws Error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/lucky-draws/winners
 * Fetch recent winners across all draws
 */
router.get('/winners', async (req, res) => {
  try {
    const winners = await LuckyDrawWinner.findAll({
      order: [['created_at', 'DESC']],
      limit: 20,
      include: [
        {
          model: User,
          attributes: ['first_name', 'username', 'photo_url']
        },
        {
          model: LuckyDraw,
          attributes: ['title', 'prize_amount', 'type']
        }
      ]
    });
    res.json(winners);
  } catch (err) {
    console.error("Fetch Winners Error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/lucky-draws/:slug
 * Fetch detail of a single draw with active user's stats
 */
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const initData = req.headers['x-telegram-init-data'];

    const draw = await LuckyDraw.findOne({
      where: { slug }
    });

    if (!draw) return res.status(404).json({ error: 'Draw not found' });

    const totalEntries = await LuckyDrawEntry.count({ where: { lucky_draw_id: draw.id } });
    const uniqueParticipants = await LuckyDrawEntry.count({
      where: { lucky_draw_id: draw.id },
      distinct: true,
      col: 'user_id'
    });

    // Winners list if draw ended
    let winners = [];
    if (draw.status === 'ended') {
      winners = await LuckyDrawWinner.findAll({
        where: { lucky_draw_id: draw.id },
        include: [{ model: User, attributes: ['first_name', 'username', 'photo_url'] }]
      });
    }

    let userStats = {
      total: 0,
      free: 0,
      ad: 0,
      coins: 0,
      referral: 0,
      cooldownRemaining: 0,
      cooldownPeriod: 60
    };

    if (initData) {
      const urlParams = new URLSearchParams(initData);
      const tgUser = JSON.parse(urlParams.get('user'));
      
      const userEntries = await LuckyDrawEntry.findAll({
        where: { lucky_draw_id: draw.id, user_id: tgUser.id }
      });

      userStats.total = userEntries.length;
      userEntries.forEach(e => {
        if (e.entry_source === 'free') userStats.free++;
        if (e.entry_source === 'ad') userStats.ad++;
        if (e.entry_source === 'coins') userStats.coins++;
        if (e.entry_source === 'referral') userStats.referral++;
      });

      // Compute Cooldown
      const lastAdEntry = await LuckyDrawEntry.findOne({
        where: {
          user_id: tgUser.id,
          entry_source: 'ad'
        },
        order: [['created_at', 'DESC']]
      });

      const AppSetting = require('../models/AppSetting');
      const settings = await AppSetting.findByPk(1);
      const cooldownPeriod = settings ? settings.ad_entry_cooldown : 60;
      userStats.cooldownPeriod = cooldownPeriod;

      if (lastAdEntry) {
        const elapsedSec = Math.floor((Date.now() - new Date(lastAdEntry.created_at).getTime()) / 1000);
        if (elapsedSec < cooldownPeriod) {
          userStats.cooldownRemaining = cooldownPeriod - elapsedSec;
        }
      }
    }

    res.json({
      draw,
      totalEntries,
      participantsCount: uniqueParticipants,
      winners,
      userStats
    });

  } catch (err) {
    console.error("Fetch Draw Detail Error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/lucky-draws/:id/enter
 * Enter a lucky draw
 */
router.post('/:id/enter', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { entry_source } = req.body; // 'free' | 'ad' | 'coins' | 'referral'
    const initData = req.headers['x-telegram-init-data'];

    if (!initData) return res.status(401).json({ error: 'Unauthorized' });

    const urlParams = new URLSearchParams(initData);
    const tgUser = JSON.parse(urlParams.get('user'));

    const user = await User.findByPk(tgUser.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    let cooldownPeriod = 60;

    // Anti-Fraud check: Account age
    const accountAgeHours = (new Date() - new Date(user.created_at)) / (1000 * 60 * 60);
    if (accountAgeHours < 6) {
      return res.status(400).json({ error: 'Account must be at least 6 hours old to participate in Lucky Draws' });
    }

    const draw = await LuckyDraw.findByPk(id);
    if (!draw) return res.status(404).json({ error: 'Lucky Draw event not found' });

    if (draw.status !== 'active') {
      return res.status(400).json({ error: 'This draw event is not currently active' });
    }

    // Get current user entries
    const userEntries = await LuckyDrawEntry.findAll({
      where: { lucky_draw_id: draw.id, user_id: user.telegram_id }
    });

    const sourceCounts = {
      free: 0,
      ad: 0,
      coins: 0,
      referral: 0
    };
    userEntries.forEach(e => {
      sourceCounts[e.entry_source]++;
    });

    const currentTotal = userEntries.length;

    // Check Global Cap per user
    if (currentTotal >= draw.max_entries_per_user) {
      return res.status(400).json({ error: `You have reached the maximum of ${draw.max_entries_per_user} total entries for this draw.` });
    }

    // Handle Entry logic by source
    if (entry_source === 'free') {
      if (!draw.free_entries_allowed) {
        return res.status(400).json({ error: 'Free entry is not allowed in this draw.' });
      }
      if (sourceCounts.free >= 1) {
        return res.status(400).json({ error: 'You have already claimed your daily/free entry for this draw.' });
      }
    } 
    else if (entry_source === 'ad') {
      if (!draw.ad_entries_enabled) {
        return res.status(400).json({ error: 'Watching Ads for entries is not enabled for this draw.' });
      }
      if (sourceCounts.ad >= draw.max_ad_entries) {
        return res.status(400).json({ error: `You have reached the limit of ${draw.max_ad_entries} ad-based entries.` });
      }
      
      // Cooldown Check
      const lastAdEntry = await LuckyDrawEntry.findOne({
        where: {
          user_id: user.telegram_id,
          entry_source: 'ad'
        },
        order: [['created_at', 'DESC']]
      });
      const AppSetting = require('../models/AppSetting');
      const settings = await AppSetting.findByPk(1);
      cooldownPeriod = settings ? settings.ad_entry_cooldown : 60;
      if (lastAdEntry) {
        const elapsedSec = Math.floor((Date.now() - new Date(lastAdEntry.created_at).getTime()) / 1000);
        if (elapsedSec < cooldownPeriod) {
          return res.status(400).json({ error: `Please wait ${cooldownPeriod - elapsedSec} seconds before adding another ad ticket.` });
        }
      }
    } 
    else if (entry_source === 'coins') {
      if (!draw.coin_entry_enabled) {
        return res.status(400).json({ error: 'Coin-based entry is not supported for this draw.' });
      }
      if (user.balance < draw.coin_cost_per_entry) {
        return res.status(400).json({ error: `Insufficient coins. Entry costs ${draw.coin_cost_per_entry} coins.` });
      }

      // Deduct coins
      await user.update({ balance: user.balance - draw.coin_cost_per_entry }, { transaction: t });

      // Transaction log
      await Transaction.create({
        telegram_id: user.telegram_id,
        amount: -draw.coin_cost_per_entry,
        type: 'lucky_draw_entry',
        description: `Entry purchased for "${draw.title}"`,
        reference_id: `LD-BUY-${draw.id}-${Date.now()}`,
        status: 'completed'
      }, { transaction: t });
    } 
    else if (entry_source === 'referral') {
      if (!draw.referral_entries_enabled) {
        return res.status(400).json({ error: 'Referrals are not enabled as an entry source for this draw.' });
      }
      // Referral draw handles tickets differently (1 referral = 1 entry automatically or claimed)
      // For this generic entry creation, we require verified referrals
    } 
    else {
      return res.status(400).json({ error: 'Invalid entry source specified.' });
    }

    // Save entry
    const entry = await LuckyDrawEntry.create({
      lucky_draw_id: draw.id,
      user_id: user.telegram_id,
      entry_source
    }, { transaction: t });

    await t.commit();
    res.json({
      success: true,
      message: 'Ticket entry registered successfully!',
      entry,
      cooldownRemaining: cooldownPeriod,
      cooldownPeriod
    });

  } catch (err) {
    if (t && !t.finished) {
      await t.rollback();
    }
    console.error("Enter LuckyDraw Error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
