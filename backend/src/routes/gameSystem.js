const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const GameSession = require('../models/GameSession');
const Contest = require('../models/Contest');
const ContestEntry = require('../models/ContestEntry');
const User = require('../models/User');
const { trackContestActivity } = require('../utils/contestTracker');
const { sequelize } = require('../config/database');

/**
 * GET /api/games
 * List available games
 */
router.get('/', async (req, res) => {
  try {
    const games = await Game.findAll({ where: { status: 'active' } });
    res.json(games);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/games/:slug/session
 * Start a new game session
 */
router.post('/:slug/session', async (req, res) => {
  try {
    const { slug } = req.params;
    const { contest_id } = req.body;
    const initData = req.headers['x-telegram-init-data'];

    if (!initData) return res.status(401).json({ error: 'Unauthorized' });
    const urlParams = new URLSearchParams(initData);
    const tgUser = JSON.parse(urlParams.get('user'));

    const game = await Game.findOne({ where: { slug } });
    if (!game) return res.status(404).json({ error: 'Game not found' });

    // If it's a contest session, check if user is in the contest
    if (contest_id) {
      const entry = await ContestEntry.findOne({ where: { contest_id, user_id: tgUser.id } });
      if (!entry) return res.status(403).json({ error: 'You must join the contest first' });
    }

    const session = await GameSession.create({
      user_id: tgUser.id,
      game_id: game.id,
      contest_id: contest_id || null,
      status: 'started'
    });

    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/games/sessions/:id/submit
 * Submit game score
 */
router.post('/sessions/:id/submit', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { score, duration, metadata } = req.body;
    const initData = req.headers['x-telegram-init-data'];

    if (!initData) return res.status(401).json({ error: 'Unauthorized' });

    const session = await GameSession.findByPk(id, { transaction: t });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.status !== 'started') return res.status(400).json({ error: 'Session already finalized' });

    // Basic Anti-Cheat: Check score feasibility (prototype logic)
    // E.g., Max score per second check
    const maxFeasibleScore = (duration || 60) * 10; // 10 points per second
    if (score > maxFeasibleScore) {
       // Mark as invalid but don't error out immediately to avoid tip-offs
       session.is_valid = false;
    }

    await session.update({
      score,
      duration,
      metadata,
      status: 'completed'
    }, { transaction: t });

    // If linked to a contest, update the contest leaderboard
    if (session.contest_id && session.is_valid) {
      const contest = await Contest.findByPk(session.contest_id, { transaction: t });
      if (contest && contest.tracking_type === 'game_score') {
        // For game contests, we usually take the BEST score or ADD to total
        // The user's spec implies "Leaderboard refreshes" based on score.
        // We'll update the entry's score if this is better than previous, or cumulative?
        // Usually tournaments are "Best Score". Let's assume Best Score for now.
        
        const entry = await ContestEntry.findOne({
          where: { contest_id: session.contest_id, user_id: session.user_id },
          transaction: t
        });

        if (entry) {
          if (score > entry.score) {
            await entry.update({ score }, { transaction: t });
          }
        }
      }
    }

    await t.commit();
    res.json({ success: true, score, is_valid: session.is_valid });

  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
