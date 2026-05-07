const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Referral = require('../models/Referral');
const ReferralSetting = require('../models/ReferralSetting');
const ReferralMilestone = require('../models/ReferralMilestone');
const Transaction = require('../models/Transaction');
const { validateTelegramInitData } = require('../utils/telegramAuth');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/**
 * GET /api/referrals/me
 * Get current user's referral stats, progress, and history
 */
router.get('/me', async (req, res) => {
  try {
    const initData = req.headers['x-telegram-init-data'];
    if (!validateTelegramInitData(initData, BOT_TOKEN) && process.env.NODE_ENV === 'production') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const urlParams = new URLSearchParams(initData);
    const tgUser = JSON.parse(urlParams.get('user'));
    const userId = tgUser.id;

    // Fetch Stats
    const totalInvited = await Referral.count({ where: { referrer_id: userId } });
    const successfulReferrals = await Referral.count({ 
      where: { 
        referrer_id: userId,
        status: 'rewarded'
      } 
    });

    // Fetch Settings for the UI
    const settings = await ReferralSetting.findByPk(1);

    // Fetch Milestones
    const milestones = await ReferralMilestone.findAll({ order: [['required_referrals', 'ASC']] });

    // Fetch Recent Activity
    const activity = await Referral.findAll({
      where: { referrer_id: userId },
      include: [{ model: User, as: 'referred', attributes: ['first_name', 'username'] }],
      order: [['created_at', 'DESC']],
      limit: 10
    });

    res.json({
      stats: {
        totalInvited,
        successfulReferrals,
        totalEarned: successfulReferrals * (settings?.referral_reward || 300)
      },
      settings,
      milestones,
      activity
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/referrals/claim-milestone
 */
router.post('/claim-milestone', async (req, res) => {
  try {
    const initData = req.headers['x-telegram-init-data'];
    if (!validateTelegramInitData(initData, BOT_TOKEN) && process.env.NODE_ENV === 'production') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const urlParams = new URLSearchParams(initData);
    const tgUser = JSON.parse(urlParams.get('user'));
    const userId = tgUser.id;
    const { milestoneId } = req.body;

    const milestone = await ReferralMilestone.findByPk(milestoneId);
    if (!milestone) return res.status(404).json({ error: 'Milestone not found' });

    const successfulReferrals = await Referral.count({ 
      where: { 
        referrer_id: userId,
        status: 'rewarded'
      } 
    });

    if (successfulReferrals < milestone.required_referrals) {
      return res.status(400).json({ error: 'Requirement not met' });
    }

    // Check if already claimed
    const alreadyClaimed = await Transaction.findOne({
      where: {
        telegram_id: userId,
        type: 'milestone',
        description: `Referral Milestone: ${milestone.required_referrals} invites`
      }
    });

    if (alreadyClaimed) {
      return res.status(400).json({ error: 'Already claimed' });
    }

    // Award reward
    const user = await User.findByPk(userId);
    await user.increment('balance', { by: milestone.reward_coins });
    
    await Transaction.create({
      telegram_id: userId,
      amount: milestone.reward_coins,
      type: 'milestone',
      description: `Referral Milestone: ${milestone.required_referrals} invites`,
      status: 'completed'
    });

    res.json({ success: true, reward: milestone.reward_coins });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
