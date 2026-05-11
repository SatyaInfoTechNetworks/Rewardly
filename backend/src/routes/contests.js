const express = require('express');
const router = express.Router();
const Contest = require('../models/Contest');
const ContestReward = require('../models/ContestReward');
const ContestEntry = require('../models/ContestEntry');
const User = require('../models/User');
const { validateTelegramInitData } = require('../utils/telegramAuth');
const { sequelize } = require('../config/database');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/**
 * GET /api/contests
 * List all active and upcoming contests
 */
router.get('/', async (req, res) => {
  try {
    const contests = await Contest.findAll({
      where: { status: ['active', 'scheduled'] },
      include: [
        { model: ContestReward, as: 'rewards' }
      ],
      order: [['start_time', 'ASC']]
    });

    // Add participants counts
    const contestsWithCounts = await Promise.all(contests.map(async (c) => {
      const count = await ContestEntry.count({ where: { contest_id: c.id } });
      return { ...c.toJSON(), participantsCount: count };
    }));

    res.json(contestsWithCounts);
  } catch (err) {
    console.error("Fetch Contests Error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/contests/:slug
 * Get details and leaderboard for a specific contest
 */
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const initData = req.headers['x-telegram-init-data'];
    
    const contest = await Contest.findOne({
      where: { slug },
      include: [{ model: ContestReward, as: 'rewards' }]
    });

    if (!contest) return res.status(404).json({ error: 'Contest not found' });

    // Fetch Top 50 Leaderboard
    const leaderboard = await ContestEntry.findAll({
      where: { contest_id: contest.id, status: 'active' },
      include: [{ model: User, attributes: ['first_name', 'username', 'photo_url'] }],
      order: [['score', 'DESC']],
      limit: 50
    });

    let userEntry = null;
    if (initData) {
      const urlParams = new URLSearchParams(initData);
      const tgUser = JSON.parse(urlParams.get('user'));
      userEntry = await ContestEntry.findOne({
        where: { contest_id: contest.id, user_id: tgUser.id }
      });
    }

/**
 * POST /api/contests/:id/join
 * Join a paid or manual-entry contest
 */
router.post('/:id/join', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const initData = req.headers['x-telegram-init-data'];
    
    if (!initData) return res.status(401).json({ error: 'Unauthorized' });

    const urlParams = new URLSearchParams(initData);
    const tgUser = JSON.parse(urlParams.get('user'));
    
    const user = await User.findByPk(tgUser.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Minimum Account Requirements (Anti-Fraud)
    const accountAgeHours = (new Date() - new Date(user.created_at)) / (1000 * 60 * 60);
    if (accountAgeHours < 24) {
      return res.status(400).json({ error: 'Account must be at least 24 hours old to join premium contests' });
    }

    if (user.total_earned < 100) {
      return res.status(400).json({ error: 'You need at least 100 lifetime earned coins to participate' });
    }

    const contest = await Contest.findByPk(id);
    if (!contest) return res.status(404).json({ error: 'Contest not found' });

    // 1. Validation
    if (contest.status !== 'active' && contest.status !== 'scheduled') {
      return res.status(400).json({ error: 'Contest is not active' });
    }

    // Check if already joined
    const existingEntry = await ContestEntry.findOne({
      where: { contest_id: contest.id, user_id: user.telegram_id }
    });
    if (existingEntry) return res.status(400).json({ error: 'You have already joined this contest' });

    // Check if full
    if (contest.maximum_participants) {
      const currentCount = await ContestEntry.count({ where: { contest_id: contest.id } });
      if (currentCount >= contest.maximum_participants) {
        return res.status(400).json({ error: 'Contest is full' });
      }
    }

    // 2. Handle Entry Fee
    if (contest.access_type === 'paid' && contest.entry_fee > 0) {
      if (contest.entry_fee_type === 'coins') {
        if (user.balance < contest.entry_fee) {
          return res.status(400).json({ error: 'Insufficient coins' });
        }

        // Deduct coins
        await user.update({ balance: user.balance - contest.entry_fee }, { transaction: t });

        // Record Transaction
        await Transaction.create({
          telegram_id: user.telegram_id,
          amount: -contest.entry_fee,
          type: 'contest_entry',
          description: `Entry Fee: ${contest.name}`,
          contest_id: contest.id,
          status: 'completed'
        }, { transaction: t });
      } else {
        // Cash entry (future)
        return res.status(400).json({ error: 'Cash entry not supported yet' });
      }
    }

    // 3. Create Entry
    const entry = await ContestEntry.create({
      contest_id: contest.id,
      user_id: user.telegram_id,
      score: 0,
      status: 'active'
    }, { transaction: t });

    await t.commit();
    res.json({ success: true, message: 'Joined successfully', entry });

  } catch (err) {
    await t.rollback();
    console.error("Join Contest Error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
