const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const PayoutMethod = require('../models/PayoutMethod');
const PayoutTier = require('../models/PayoutTier');
const WithdrawalRequest = require('../models/WithdrawalRequest');
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
    const { balance, status, is_banned, is_phone_verified, is_channel_joined, phone_number } = req.body;
    
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

/**
 * GET /api/admin/payout-methods
 */
router.get('/payout-methods', adminAuth, async (req, res) => {
  try {
    const methods = await PayoutMethod.findAll({
      include: [{ model: PayoutTier, as: 'tiers' }]
    });
    res.json(methods);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/payout-methods
 * Create method and its tiers
 */
router.post('/payout-methods', adminAuth, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { tiers, ...methodData } = req.body;
    const method = await PayoutMethod.create(methodData, { transaction: t });
    
    if (tiers && tiers.length > 0) {
      const tiersWithMethodId = tiers.map(tier => {
        const { id, ...cleanTier } = tier; // Strip ID to prevent conflict
        return {
          ...cleanTier,
          payout_method_id: method.id
        };
      });
      await PayoutTier.bulkCreate(tiersWithMethodId, { transaction: t });
    }
    
    await t.commit();
    res.json(method);
  } catch (error) {
    await t.rollback();
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/admin/payout-methods/:id
 * Update method and sync tiers
 */
router.put('/payout-methods/:id', adminAuth, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { tiers, ...methodData } = req.body;
    
    await PayoutMethod.update(methodData, { where: { id }, transaction: t });
    
    // Sync Tiers: Delete and Re-create for simplicity and reliability
    await PayoutTier.destroy({ where: { payout_method_id: id }, transaction: t });
    
    if (tiers && tiers.length > 0) {
      const tiersWithMethodId = tiers.map(tier => {
        const { id, ...cleanTier } = tier; // Strip ID to prevent conflict
        return {
          ...cleanTier,
          payout_method_id: id
        };
      });
      await PayoutTier.bulkCreate(tiersWithMethodId, { transaction: t });
    }
    
    await t.commit();
    res.json({ success: true });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/payout-tiers
 */
router.post('/payout-tiers', adminAuth, async (req, res) => {
  try {
    const tier = await PayoutTier.create(req.body);
    res.json(tier);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/withdrawals
 */
router.get('/withdrawals', adminAuth, async (req, res) => {
  try {
    const requests = await WithdrawalRequest.findAll({
      include: [
        { model: User, attributes: ['first_name', 'username', 'telegram_id'] },
        { model: PayoutMethod },
        { model: PayoutTier }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/admin/withdrawals/:id
 */
router.put('/withdrawals/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_note } = req.body;
    await WithdrawalRequest.update({ status, admin_note }, { where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
