const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { validateTelegramInitData } = require('../utils/telegramAuth');
const { trackContestActivity } = require('../utils/contestTracker');
const { validateReferral } = require('../utils/referralValidator');
const AppSetting = require('../models/AppSetting');
const { generateTransactionId } = require('../utils/transactions');

const getSettings = async () => {
  let settings = await AppSetting.findByPk(1);
  if (!settings) settings = await AppSetting.create({ id: 1 });
  return settings;
};

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
    const settings = await getSettings();
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
      remainingPlays: Math.max(0, settings.game_limit_per_day - user.daily_games_played),
      limit: settings.game_limit_per_day,
      rewardPerGame: settings.game_reward_coins,
      adsgramEnabled: settings.adsgram_enabled,
      monetagEnabled: settings.monetag_enabled
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
    const settings = await getSettings();
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
    if (user.daily_games_played >= settings.game_limit_per_day) {
      return res.status(400).json({ error: 'Daily play limit reached. Come back tomorrow!' });
    }

    // Update User
    const rewardAmount = settings.game_reward_coins;
    user.daily_games_played += 1;
    await user.save();

    // Reload user to catch the updated balance credited by the AdsGram S2S postback!
    await user.reload();

    res.json({
      success: true,
      reward: rewardAmount,
      newBalance: user.balance,
      todayPlays: user.daily_games_played,
      remainingPlays: Math.max(0, settings.game_limit_per_day - user.daily_games_played)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
