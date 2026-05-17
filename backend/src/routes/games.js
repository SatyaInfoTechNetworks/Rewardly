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

    // Cooldown check
    const lastGameTx = await Transaction.findOne({
      where: {
        telegram_id: tgUser.id,
        type: 'game'
      },
      order: [['created_at', 'DESC']]
    });
    
    let cooldownRemaining = 0;
    if (lastGameTx) {
      const elapsedSec = Math.floor((Date.now() - new Date(lastGameTx.createdAt || lastGameTx.created_at).getTime()) / 1000);
      if (elapsedSec < settings.watch_earn_cooldown) {
        cooldownRemaining = settings.watch_earn_cooldown - elapsedSec;
      }
    }

    res.json({
      balance: user.balance,
      todayPlays: user.daily_games_played,
      remainingPlays: Math.max(0, settings.game_limit_per_day - user.daily_games_played),
      limit: settings.game_limit_per_day,
      rewardPerGame: settings.game_reward_coins,
      adsgramEnabled: settings.adsgram_enabled,
      monetagEnabled: settings.monetag_enabled,
      adsgramBlockId: settings.adsgram_block_id,
      cooldownRemaining,
      cooldownPeriod: settings.watch_earn_cooldown
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

    // Cooldown check on reward endpoint
    const lastGameTx = await Transaction.findOne({
      where: {
        telegram_id: tgUser.id,
        type: 'game'
      },
      order: [['created_at', 'DESC']]
    });
    
    if (lastGameTx) {
      const elapsedSec = Math.floor((Date.now() - new Date(lastGameTx.createdAt || lastGameTx.created_at).getTime()) / 1000);
      if (elapsedSec < settings.watch_earn_cooldown) {
        return res.status(400).json({ error: `Please wait ${settings.watch_earn_cooldown - elapsedSec} seconds before watching another ad.` });
      }
    }

    // We will poll the database for up to 6 seconds to see if the S2S transaction was created
    let success = false;
    let userRecord = user;

    for (let i = 0; i < 4; i++) {
      const recentTx = await Transaction.findOne({
        where: {
          telegram_id: tgUser.id,
          type: 'game',
          description: 'Watch Ads Reward',
          created_at: {
            [require('sequelize').Op.gt]: new Date(Date.now() - 20 * 1000)
          }
        }
      });

      if (recentTx) {
        success = true;
        await user.reload();
        userRecord = user;
        break;
      }

      // Wait 1.5 seconds before polling again
      await new Promise(r => setTimeout(r, 1500));
    }

    if (!success) {
      return res.status(400).json({ error: 'Ad view verification is still pending. Please try again in a moment.' });
    }

    res.json({
      success: true,
      reward: settings.game_reward_coins,
      newBalance: userRecord.balance,
      todayPlays: userRecord.daily_games_played,
      remainingPlays: Math.max(0, settings.game_limit_per_day - userRecord.daily_games_played),
      cooldownRemaining: settings.watch_earn_cooldown,
      cooldownPeriod: settings.watch_earn_cooldown
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
