const express = require('express');
const router = express.Router();
const User = require('../models/User');
const DailyReward = require('../models/DailyReward');
const Transaction = require('../models/Transaction');
const UserVisit = require('../models/UserVisit');
const VisitTask = require('../models/VisitTask');
const { validateTelegramInitData } = require('../utils/telegramAuth');

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

    const today = new Date().toISOString().split('T')[0];
    const lastCheckIn = user.last_check_in ? user.last_check_in.toISOString().split('T')[0] : null;
    const canClaim = lastCheckIn !== today;

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
    const todayStr = now.toISOString().split('T')[0];
    const lastCheckInStr = user.last_check_in ? user.last_check_in.toISOString().split('T')[0] : null;

    if (lastCheckInStr === todayStr) {
      return res.status(400).json({ error: 'Already claimed today' });
    }

    // Check if streak should continue
    let newStreak = 1;
    if (user.last_check_in) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (lastCheckInStr === yesterdayStr) {
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

    // Create Transaction
    await Transaction.create({
      telegram_id: user.telegram_id,
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
