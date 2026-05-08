const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const User = require('../models/User');
const DailyReward = require('../models/DailyReward');
const Transaction = require('../models/Transaction');
const UserVisit = require('../models/UserVisit');
const VisitTask = require('../models/VisitTask');
const { validateTelegramInitData } = require('../utils/telegramAuth');
const { generateTransactionId } = require('../utils/transactions');

const parseInitData = (initData) => {
  const urlParams = new URLSearchParams(initData);
  const userStr = urlParams.get('user');
  if (!userStr) throw new Error('User data missing');
  return JSON.parse(userStr);
};

/**
 * GET /api/rewards/check-in/status
 */
router.get('/check-in/status', async (req, res) => {
  try {
    const initData = req.headers['x-telegram-init-data'];
    const tgUser = parseInitData(initData);
    
    const user = await User.findByPk(tgUser.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Fetch all 7 days of rewards
    let rewards = await DailyReward.findAll({ order: [['day', 'ASC']] });
    
    // Default rewards if none exist
    if (rewards.length === 0) {
      const defaults = [
        { day: 1, reward_amount: 10 },
        { day: 2, reward_amount: 20 },
        { day: 3, reward_amount: 30 },
        { day: 4, reward_amount: 40 },
        { day: 5, reward_amount: 50 },
        { day: 6, reward_amount: 80 },
        { day: 7, reward_amount: 150 },
      ];
      rewards = await DailyReward.bulkCreate(defaults);
    }

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setUTCHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setUTCHours(23, 59, 59, 999);

    const todayTransaction = await Transaction.findOne({
      where: {
        telegram_id: user.telegram_id,
        type: 'check_in',
        created_at: { [Op.between]: [startOfToday, endOfToday] }
      }
    });

    let canClaim = !todayTransaction;

    res.json({
      streak: user.streak || 0,
      lastCheckIn: user.last_check_in,
      canClaim,
      rewards
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/rewards/check-in/claim
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

    // Check if streak should continue
    let newStreak = 1;
    if (user.last_check_in) {
      const yesterday = new Date(now);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const yesterdayUTC = yesterday.getUTCFullYear() + '-' + (yesterday.getUTCMonth() + 1) + '-' + yesterday.getUTCDate();
      
      const last = new Date(user.last_check_in);
      const lastUTC = last.getUTCFullYear() + '-' + (last.getUTCMonth() + 1) + '-' + last.getUTCDate();

      if (lastUTC === yesterdayUTC) {
        newStreak = (user.streak % 7) + 1;
      }
    }

    // Get reward for the current day of streak
    const reward = await DailyReward.findOne({ where: { day: newStreak } });
    const amount = reward ? reward.reward_amount : 10;

    // Update User
    user.balance = parseInt(user.balance) + amount;
    user.streak = newStreak;
    user.last_check_in = now;
    await user.save();

    // Create Transaction with proper ID
    await Transaction.create({
      telegram_id: user.telegram_id,
      reference_id: generateTransactionId('CHKIN'),
      amount,
      type: 'check_in',
      description: `Daily Check-in Day ${newStreak}`,
      status: 'completed'
    });

    res.json({
      success: true,
      reward: amount,
      newStreak,
      newBalance: user.balance
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
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

    // Check if already completed
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
