const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { validateTelegramInitData } = require('../utils/telegramAuth');
const { trackContestActivity } = require('../utils/contestTracker');

const GAME_LIMIT_PER_DAY = 20;
const GAME_REWARD_COINS = 5;

/**
 * GET /api/games/stats
 * Returns user stats for the games screen
 */
router.get('/stats', async (req, res) => {
  const initData = req.headers['x-telegram-init-data'];
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

  if (!validateTelegramInitData(initData, BOT_TOKEN) && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const urlParams = new URLSearchParams(initData);
    const tgUser = JSON.parse(urlParams.get('user'));
    
    const user = await User.findByPk(tgUser.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const today = new Date().toISOString().split('T')[0];
    
    // Reset daily count if it's a new day
    if (user.last_game_date !== today) {
      user.daily_games_played = 0;
      user.last_game_date = today;
      await user.save();
    }

    res.json({
      balance: user.balance,
      todayPlays: user.daily_games_played,
      remainingPlays: Math.max(0, GAME_LIMIT_PER_DAY - user.daily_games_played),
      limit: GAME_LIMIT_PER_DAY
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/games/reward
 * Adds coins after watching a rewarded ad
 */
router.post('/reward', async (req, res) => {
  const { initData } = req.body;
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

  if (!validateTelegramInitData(initData, BOT_TOKEN) && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const urlParams = new URLSearchParams(initData);
    const tgUser = JSON.parse(urlParams.get('user'));
    
    const user = await User.findByPk(tgUser.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const today = new Date().toISOString().split('T')[0];

    // Reset daily count if it's a new day
    if (user.last_game_date !== today) {
      user.daily_games_played = 0;
      user.last_game_date = today;
    }

    // Check Limit
    if (user.daily_games_played >= GAME_LIMIT_PER_DAY) {
      return res.status(400).json({ error: 'Daily play limit reached. Come back tomorrow!' });
    }

    // Update User
    const oldBalance = user.balance;
    user.balance += GAME_REWARD_COINS;
    user.daily_games_played += 1;
    await user.save();

    // Log Transaction
    await Transaction.create({
      user_id: user.telegram_id,
      type: 'credit',
      amount: GAME_REWARD_COINS,
      description: 'Reward for Play & Earn ad',
      status: 'completed'
    });

    // Update Contest Activity (Earning Contest)
    await trackContestActivity(user.telegram_id, 'earning', GAME_REWARD_COINS);

    res.json({
      success: true,
      reward: GAME_REWARD_COINS,
      newBalance: user.balance,
      todayPlays: user.daily_games_played,
      remainingPlays: Math.max(0, GAME_LIMIT_PER_DAY - user.daily_games_played)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
