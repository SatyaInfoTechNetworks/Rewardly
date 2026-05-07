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
      where: { status: ['active', 'upcoming'] },
      include: [
        { model: ContestReward, as: 'rewards' },
        { model: ContestEntry, attributes: [] }
      ],
      attributes: {
        include: [
          [sequelize.fn('COUNT', sequelize.col('ContestEntries.id')), 'entriesCount']
        ]
      },
      group: ['Contest.id', 'rewards.id'],
      order: [['start_time', 'ASC']]
    });
    res.json(contests);
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

    res.json({ contest, leaderboard, userEntry });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
