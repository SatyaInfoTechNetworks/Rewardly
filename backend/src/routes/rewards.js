const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const User = require('../models/User');
const DailyReward = require('../models/DailyReward');
const Transaction = require('../models/Transaction');
const UserVisit = require('../models/UserVisit');
const VisitTask = require('../models/VisitTask');
const AppSetting = require('../models/AppSetting');
const { validateTelegramInitData } = require('../utils/telegramAuth');
const { generateTransactionId } = require('../utils/transactions');

const parseInitData = (initData) => {
  const urlParams = new URLSearchParams(initData);
  const userStr = urlParams.get('user');
  if (!userStr) throw new Error('User data missing');
  return JSON.parse(userStr);
};

const getDefaultRewards = () => [
  { day: 1, reward_amount: 10 },
  { day: 2, reward_amount: 20 },
  { day: 3, reward_amount: 30 },
  { day: 4, reward_amount: 40 },
  { day: 5, reward_amount: 50 },
  { day: 6, reward_amount: 80 },
  { day: 7, reward_amount: 150 },
];

/**
 * Calculates streak state for a user.
 * Returns: { currentStreak, nextDay, missedDay }
 * - missedDay: true if the user missed a full calendar day (gap > 48h) — streak resets
 * - currentStreak: the streak count AFTER accounting for any reset
 * - nextDay: which day they are about to claim (1-7)
 */
const calculateStreakState = (user) => {
  const now = new Date();

  if (!user.last_check_in) {
    // Brand new user — Day 1
    return { currentStreak: 0, nextDay: 1, missedDay: false };
  }

  const lastClaim = new Date(user.last_check_in);
  const diffMs = now.getTime() - lastClaim.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  // If more than 48 hours have elapsed since last claim → streak broken
  if (diffHours > 48) {
    return { currentStreak: 0, nextDay: 1, missedDay: true };
  }

  // Normal continuation — wrap at 7
  const currentStreak = user.streak || 0;
  const nextDay = (currentStreak % 7) + 1;
  return { currentStreak, nextDay, missedDay: false };
};

/**
 * GET /api/rewards/check-in/status
 * Returns streak state, rewards list, canClaim flag, and time until next claim
 */
router.get('/check-in/status', async (req, res) => {
  try {
    const initData = req.headers['x-telegram-init-data'];
    const tgUser = parseInitData(initData);
    
    const user = await User.findByPk(tgUser.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Fetch rewards from DB; seed defaults if empty
    let rewards = await DailyReward.findAll({ order: [['day', 'ASC']] });
    if (rewards.length === 0) {
      rewards = await DailyReward.bulkCreate(getDefaultRewards());
    }

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setUTCHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setUTCHours(23, 59, 59, 999);

    // Check if already claimed today
    const todayTransaction = await Transaction.findOne({
      where: {
        telegram_id: user.telegram_id,
        type: 'check_in',
        created_at: { [Op.between]: [startOfToday, endOfToday] }
      }
    });

    const canClaim = !todayTransaction;

    // Compute streak state
    const { currentStreak, nextDay, missedDay } = calculateStreakState(user);

    // Compute time until next claim (next UTC midnight)
    let nextClaimAt = null;
    if (!canClaim && user.last_check_in) {
      const tomorrow = new Date(now);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      tomorrow.setUTCHours(0, 0, 0, 0);
      nextClaimAt = tomorrow.toISOString();
    }

    res.json({
      streak: currentStreak,
      nextDay,
      missedDay,
      lastCheckIn: user.last_check_in,
      canClaim,
      nextClaimAt,
      rewards
    });
  } catch (err) {
    console.error('[CheckIn Status Error]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/rewards/check-in/claim
 * Direct claim (used if AdsGram is disabled / for testing).
 * In production, reward is granted via the AdsGram S2S postback below.
 */
router.post('/check-in/claim', async (req, res) => {
  try {
    const { initData } = req.body;
    const tgUser = parseInitData(initData);
    
    const user = await User.findByPk(tgUser.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setUTCHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setUTCHours(23, 59, 59, 999);

    // Duplicate guard
    const todayTransaction = await Transaction.findOne({
      where: {
        telegram_id: user.telegram_id,
        type: 'check_in',
        created_at: { [Op.between]: [startOfToday, endOfToday] }
      }
    });

    if (todayTransaction) {
      return res.status(400).json({ error: 'Already claimed today' });
    }

    const { nextDay, missedDay } = calculateStreakState(user);
    const newStreak = nextDay;

    // Fetch the reward for this day
    const rewardRow = await DailyReward.findOne({ where: { day: newStreak } });
    const amount = rewardRow ? rewardRow.reward_amount : 10;

    // Persist
    user.balance = parseInt(user.balance) + amount;
    user.streak = newStreak;
    user.last_check_in = now;
    await user.save();

    await Transaction.create({
      telegram_id: user.telegram_id,
      reference_id: generateTransactionId('CHKIN'),
      amount,
      type: 'check_in',
      description: `Daily Check-in Day ${newStreak}${missedDay ? ' (Streak Reset)' : ''}`,
      status: 'completed'
    });

    console.log(`✅ [CheckIn] User ${user.telegram_id} claimed Day ${newStreak} → ${amount} coins${missedDay ? ' | STREAK RESET' : ''}`);

    res.json({
      success: true,
      reward: amount,
      newStreak,
      missedDay,
      newBalance: user.balance
    });
  } catch (err) {
    console.error('[CheckIn Claim Error]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/rewards/adsgram-checkin-postback
 * S2S Postback from AdsGram after a successful ad view for daily check-in.
 * AdsGram calls: GET /api/rewards/adsgram-checkin-postback?user_id={user_id}&token={security_token}
 *
 * You must set your postback URL in the AdsGram dashboard as:
 * https://your-api.com/api/rewards/adsgram-checkin-postback?user_id={user_id}&token={token}
 */
router.get('/adsgram-checkin-postback', async (req, res) => {
  const { user_id, token } = req.query;

  console.log(`📥 [AdsGram CheckIn Postback] user_id=${user_id}`);

  if (!user_id) {
    console.error('[AdsGram CheckIn] Missing user_id');
    return res.status(400).send('Missing user_id');
  }

  // Optional: Verify security token if you set one in AdsGram dashboard
  const ADSGRAM_SECRET = process.env.ADSGRAM_POSTBACK_SECRET;
  if (ADSGRAM_SECRET && token !== ADSGRAM_SECRET) {
    console.error('[AdsGram CheckIn] Invalid security token');
    return res.status(401).send('Unauthorized');
  }

  try {
    const user = await User.findByPk(user_id);
    if (!user) {
      console.error(`[AdsGram CheckIn] User ${user_id} not found`);
      return res.status(404).send('User not found');
    }

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setUTCHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setUTCHours(23, 59, 59, 999);

    // Duplicate guard — prevent double reward even if AdsGram fires twice
    const todayTransaction = await Transaction.findOne({
      where: {
        telegram_id: user.telegram_id,
        type: 'check_in',
        created_at: { [Op.between]: [startOfToday, endOfToday] }
      }
    });

    if (todayTransaction) {
      console.log(`[AdsGram CheckIn] Duplicate postback for user ${user_id}. Ignoring.`);
      return res.send('OK'); // Acknowledge to AdsGram
    }

    // Compute what day they're claiming
    const { nextDay, missedDay } = calculateStreakState(user);
    const newStreak = nextDay;

    // Pull the dynamic reward from admin panel config
    const rewardRow = await DailyReward.findOne({ where: { day: newStreak } });
    const amount = rewardRow ? rewardRow.reward_amount : 10;

    // Persist to DB
    user.balance = parseInt(user.balance) + amount;
    user.streak = newStreak;
    user.last_check_in = now;
    await user.save();

    await Transaction.create({
      telegram_id: user.telegram_id,
      reference_id: generateTransactionId('CHKIN'),
      amount,
      type: 'check_in',
      description: `Daily Check-in Day ${newStreak}${missedDay ? ' (Streak Reset)' : ''}`,
      status: 'completed'
    });

    console.log(`✅ [AdsGram CheckIn] User ${user_id} → Day ${newStreak} → +${amount} coins${missedDay ? ' | RESET' : ''}`);
    return res.send('OK');
  } catch (err) {
    console.error('[AdsGram CheckIn Postback Error]', err);
    return res.status(500).send('Internal Error');
  }
});

/**
 * GET /api/rewards/visit/tasks
 */
router.get('/visit/tasks', async (req, res) => {
  try {
    const initData = req.headers['x-telegram-init-data'];
    const tgUser = parseInitData(initData);
    
    const tasks = await VisitTask.findAll({ where: { status: 'active' } });
    const completions = await UserVisit.findAll({ where: { user_id: tgUser.id } });
    const completedIds = completions.map(c => c.task_id);

    res.json({ tasks, completedIds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/rewards/visit/claim
 */
router.post('/visit/claim', async (req, res) => {
  try {
    const { initData, taskId } = req.body;
    const tgUser = parseInitData(initData);
    
    const task = await VisitTask.findByPk(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const existing = await UserVisit.findOne({ where: { user_id: tgUser.id, task_id: taskId } });
    if (existing) return res.status(400).json({ error: 'Already completed' });

    const user = await User.findByPk(tgUser.id);
    user.balance = parseInt(user.balance) + task.reward_amount;
    await user.save();

    await UserVisit.create({ user_id: tgUser.id, task_id: taskId });

    await Transaction.create({
      telegram_id: tgUser.id,
      reference_id: generateTransactionId('VISIT'),
      amount: task.reward_amount,
      type: 'visit',
      description: `Visit & Earn: ${task.title}`,
      status: 'completed'
    });

    res.json({ success: true, reward: task.reward_amount, newBalance: user.balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
