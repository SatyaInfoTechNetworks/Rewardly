const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { sequelize } = require('../config/database');

/**
 * Admin Middleware
 * Simple token-based check
 */
const adminAuth = (req, res, next) => {
  const secret = req.headers['x-admin-secret'];
  if (secret === process.env.ADMIN_SECRET) {
    next();
  } else {
    res.status(403).json({ error: 'Unauthorized access' });
  }
};

/**
 * GET /api/admin/stats
 * Overview of the platform
 */
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalBalance = await User.sum('balance') || 0;
    const totalTransactions = await Transaction.count();
    
    res.json({
      totalUsers,
      totalBalance,
      totalTransactions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/users
 * List all users with pagination
 */
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.findAll({
      order: [['created_at', 'DESC']],
      limit: 100
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/transactions
 * List recent transactions
 */
router.get('/transactions', adminAuth, async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      order: [['created_at', 'DESC']],
      limit: 50
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/seed
 * Populates database with mock data for testing
 */
router.get('/seed', adminAuth, async (req, res) => {
  try {
    // 1. Create Mock Users
    const mockUsers = [
      { telegram_id: 12345678, first_name: 'Satya', username: 'satya_dev', balance: 5000 },
      { telegram_id: 87654321, first_name: 'Rahul', username: 'rahul_earn', balance: 2450 },
      { telegram_id: 11223344, first_name: 'Priya', username: 'priya_surveys', balance: 1200 }
    ];

    for (const u of mockUsers) {
      await User.findOrCreate({ where: { telegram_id: u.telegram_id }, defaults: u });
    }

    // 2. Create Mock Transactions
    await Transaction.create({
      telegram_id: 12345678,
      amount: 500,
      type: 'survey',
      description: 'Test Survey Reward',
      status: 'completed'
    });

    res.json({ success: true, message: 'Database seeded with mock data' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/admin/users/:id
 * Update user details (balance, status, etc.)
 */
router.put('/users/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { balance, status, is_banned } = req.body;
    
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    if (balance !== undefined) user.balance = balance;
    if (status !== undefined) user.status = status;
    if (is_banned !== undefined) user.is_banned = is_banned;
    if (is_phone_verified !== undefined) user.is_phone_verified = is_phone_verified;
    if (is_channel_joined !== undefined) user.is_channel_joined = is_channel_joined;
    if (phone_number !== undefined) user.phone_number = phone_number;
    
    await user.save();
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete user and their transactions
 */
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await Transaction.destroy({ where: { telegram_id: id } });
    await User.destroy({ where: { telegram_id: id } });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
