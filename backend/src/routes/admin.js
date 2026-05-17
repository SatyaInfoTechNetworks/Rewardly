const express = require('express');
const router = express.Router();
const PayoutMethod = require('../models/PayoutMethod');
const PayoutTier = require('../models/PayoutTier');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const User = require('../models/User');
const Referral = require('../models/Referral');
const ReferralSetting = require('../models/ReferralSetting');
const ReferralMilestone = require('../models/ReferralMilestone');
const Transaction = require('../models/Transaction');
const Contest = require('../models/Contest');
const ContestReward = require('../models/ContestReward');
const ContestEntry = require('../models/ContestEntry');
const AppSetting = require('../models/AppSetting');
const LuckyDraw = require('../models/LuckyDraw');
const LuckyDrawEntry = require('../models/LuckyDrawEntry');
const LuckyDrawWinner = require('../models/LuckyDrawWinner');
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
 * POST /api/admin/reset-streaks
 * Resets all user daily streak counters to 0
 */
router.post('/reset-streaks', adminAuth, async (req, res) => {
  try {
    await User.update({ streak: 0, last_check_in: null }, { where: {} });
    res.json({ success: true, message: 'All user check-in daily streaks reset successfully!' });
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
      include: [{ 
        model: PayoutTier, 
        as: 'tiers',
        where: { status: 'active' },
        required: false // Keep methods even if they have no active tiers
      }]
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
    
    // Sync Tiers: Intelligent Sync to avoid Foreign Key errors
    const currentTiers = await PayoutTier.findAll({ where: { payout_method_id: id } });
    const currentTierIds = currentTiers.map(t => t.id);
    const incomingTierIds = (tiers || []).filter(t => t.id).map(t => parseInt(t.id));

    // 1. Handle Deletions
    const tiersToDelete = currentTierIds.filter(cid => !incomingTierIds.includes(cid));
    for (const tid of tiersToDelete) {
      try {
        await PayoutTier.destroy({ where: { id: tid }, transaction: t });
      } catch (err) {
        // If deletion fails due to Foreign Key (referenced by withdrawals), mark as inactive instead
        await PayoutTier.update({ status: 'inactive' }, { where: { id: tid }, transaction: t });
      }
    }

    // 2. Handle Updates & Creates
    if (tiers && tiers.length > 0) {
      for (const tier of tiers) {
        if (tier.id && currentTierIds.includes(parseInt(tier.id))) {
          // Update existing
          const { id: tid, ...updateData } = tier;
          await PayoutTier.update(updateData, { where: { id: tid }, transaction: t });
        } else {
          // Create new
          const { id: dummy, ...newData } = tier;
          await PayoutTier.create({ ...newData, payout_method_id: id, status: 'active' }, { transaction: t });
        }
      }
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
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { status, admin_note } = req.body;
    
    const withdrawal = await WithdrawalRequest.findByPk(id, { include: [User] });
    if (!withdrawal) return res.status(404).json({ error: 'Withdrawal not found' });

    await WithdrawalRequest.update({ status, admin_note }, { where: { id }, transaction: t });

    // Handle Referral Reward on Approval
    if (status === 'approved' && withdrawal.User.referred_by) {
      const settings = await ReferralSetting.findByPk(1);
      
      if (settings && settings.reward_trigger === 'redeem_approved') {
        const referral = await Referral.findOne({ 
          where: { 
            referred_user_id: withdrawal.user_id,
            status: 'pending'
          }
        });

        if (referral) {
          // Award Referrer
          const referrer = await User.findByPk(withdrawal.User.referred_by);
          if (referrer) {
            await referrer.increment('balance', { by: settings.referral_reward, transaction: t });
            await referral.update({ 
              status: 'rewarded', 
              reward_given: true, 
              completed_at: new Date() 
            }, { transaction: t });

            await Transaction.create({
              telegram_id: referrer.telegram_id,
              amount: settings.referral_reward,
              type: 'referral',
              description: `Referral Reward: ${withdrawal.User.first_name} completed first redeem`,
              status: 'completed'
            }, { transaction: t });

            // Track Referral Contest
            const { trackContestActivity } = require('../utils/contestTracker');
            await trackContestActivity(referrer.telegram_id, 'referrals', 1);
          }
        }
      }
    }

    await t.commit();
    res.json({ success: true });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ error: error.message });
  }
});

// --- Referral Settings & Milestones ---

router.get('/referral/settings', adminAuth, async (req, res) => {
  try {
    const settings = await ReferralSetting.findByPk(1);
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/referral/settings', adminAuth, async (req, res) => {
  try {
    await ReferralSetting.update(req.body, { where: { id: 1 } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/referral/milestones', adminAuth, async (req, res) => {
  try {
    const milestones = await ReferralMilestone.findAll({ order: [['required_referrals', 'ASC']] });
    res.json(milestones);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/referral/milestones', adminAuth, async (req, res) => {
  try {
    const milestone = await ReferralMilestone.create(req.body);
    res.json(milestone);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/referral/milestones/:id', adminAuth, async (req, res) => {
  try {
    await ReferralMilestone.update(req.body, { where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/referral/milestones/:id', adminAuth, async (req, res) => {
  try {
    await ReferralMilestone.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/referral/stats', adminAuth, async (req, res) => {
  try {
    const totalInvites = await Referral.count();
    const rewardedInvites = await Referral.count({ where: { status: 'rewarded' } });
    const pendingInvites = await Referral.count({ where: { status: 'pending' } });
    
    res.json({
      totalInvites,
      rewardedInvites,
      pendingInvites,
      conversionRate: totalInvites > 0 ? ((rewardedInvites / totalInvites) * 100).toFixed(1) : 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Global App Settings ---

router.get('/settings', adminAuth, async (req, res) => {
  try {
    let settings = await AppSetting.findByPk(1);
    if (!settings) {
      settings = await AppSetting.create({ id: 1 });
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/settings', adminAuth, async (req, res) => {
  try {
    await AppSetting.update(req.body, { where: { id: 1 } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
/**
 * CONTEST MANAGEMENT
 */

router.get('/contests', adminAuth, async (req, res) => {
  try {
    const contests = await Contest.findAll({
      include: [{ model: ContestReward, as: 'rewards' }],
      order: [['created_at', 'DESC']]
    });
    res.json(contests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/contests', adminAuth, async (req, res) => {
  try {
    const contest = await Contest.create(req.body);
    res.json(contest);
  } catch (err) {
    console.error("Contest Creation Error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/contests/:id', adminAuth, async (req, res) => {
  try {
    const contest = await Contest.findByPk(req.params.id);
    if (!contest) return res.status(404).json({ error: 'Contest not found' });
    await contest.update(req.body);
    res.json(contest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/contests/:id', adminAuth, async (req, res) => {
  try {
    await Contest.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reward Management
router.post('/contests/:id/rewards', adminAuth, async (req, res) => {
  try {
    const reward = await ContestReward.create({ ...req.body, contest_id: req.params.id });
    res.json(reward);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/contests/rewards/:id', adminAuth, async (req, res) => {
  try {
    await ContestReward.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Check-in Rewards Management ---
router.get('/rewards', adminAuth, async (req, res) => {
  try {
    const DailyReward = require('../models/DailyReward');
    const rewards = await DailyReward.findAll({ order: [['day', 'ASC']] });
    res.json(rewards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/rewards', adminAuth, async (req, res) => {
  try {
    const DailyReward = require('../models/DailyReward');
    const { rewards } = req.body;
    
    for (const r of rewards) {
      await DailyReward.update(
        { reward_amount: r.reward_amount },
        { where: { day: r.day } }
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Visit Tasks Management ---
router.get('/visit-tasks', adminAuth, async (req, res) => {
  try {
    const VisitTask = require('../models/VisitTask');
    const tasks = await VisitTask.findAll({ order: [['created_at', 'DESC']] });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/visit-tasks', adminAuth, async (req, res) => {
  try {
    const VisitTask = require('../models/VisitTask');
    const task = await VisitTask.create(req.body);
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/visit-tasks/:id', adminAuth, async (req, res) => {
  try {
    const VisitTask = require('../models/VisitTask');
    await VisitTask.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/transactions
 * Fetch all system transactions
 */
router.get('/transactions', adminAuth, async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      order: [['created_at', 'DESC']],
      limit: 500 // Limit for performance
    });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ──── LUCKY DRAW MANAGEMENT ENDPOINTS ────
 */

// 1. GET /api/admin/lucky-draws - List all draws with metrics
router.get('/lucky-draws', adminAuth, async (req, res) => {
  try {
    const draws = await LuckyDraw.findAll({
      order: [['created_at', 'DESC']]
    });

    const enrichedDraws = await Promise.all(draws.map(async (d) => {
      const totalEntries = await LuckyDrawEntry.count({ where: { lucky_draw_id: d.id } });
      const uniqueParticipants = await LuckyDrawEntry.count({
        where: { lucky_draw_id: d.id },
        distinct: true,
        col: 'user_id'
      });
      const adEntries = await LuckyDrawEntry.count({ where: { lucky_draw_id: d.id, entry_source: 'ad' } });
      const coinEntries = await LuckyDrawEntry.count({ where: { lucky_draw_id: d.id, entry_source: 'coins' } });

      const winners = await LuckyDrawWinner.findAll({
        where: { lucky_draw_id: d.id },
        include: [{ model: User, attributes: ['first_name', 'username', 'photo_url'] }]
      });

      return {
        ...d.toJSON(),
        totalEntries,
        participantsCount: uniqueParticipants,
        adEntries,
        coinEntries,
        winners
      };
    }));

    res.json(enrichedDraws);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. POST /api/admin/lucky-draws - Create a new draw
router.post('/lucky-draws', adminAuth, async (req, res) => {
  try {
    const draw = await LuckyDraw.create(req.body);
    res.json(draw);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. PUT /api/admin/lucky-draws/:id - Update existing draw
router.put('/lucky-draws/:id', adminAuth, async (req, res) => {
  try {
    const draw = await LuckyDraw.findByPk(req.params.id);
    if (!draw) return res.status(404).json({ error: 'Draw not found' });
    await draw.update(req.body);
    res.json(draw);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. DELETE /api/admin/lucky-draws/:id - Delete draw
router.delete('/lucky-draws/:id', adminAuth, async (req, res) => {
  try {
    await LuckyDrawEntry.destroy({ where: { lucky_draw_id: req.params.id } });
    await LuckyDrawWinner.destroy({ where: { lucky_draw_id: req.params.id } });
    await LuckyDraw.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. GET /api/admin/lucky-draws/:id/entries - View participant entries
router.get('/lucky-draws/:id/entries', adminAuth, async (req, res) => {
  try {
    const entries = await LuckyDrawEntry.findAll({
      where: { lucky_draw_id: req.params.id },
      include: [
        {
          model: User,
          attributes: ['first_name', 'username', 'photo_url']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. POST /api/admin/lucky-draws/:id/roll - Manually roll winner selection
router.post('/lucky-draws/:id/roll', adminAuth, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const draw = await LuckyDraw.findByPk(req.params.id);
    if (!draw) return res.status(404).json({ error: 'Lucky Draw not found' });
    
    // Check if already has winners
    const existingWinners = await LuckyDrawWinner.count({ where: { lucky_draw_id: draw.id } });
    if (existingWinners > 0) {
      return res.status(400).json({ error: 'This draw has already selected winners. You cannot roll again.' });
    }

    const entries = await LuckyDrawEntry.findAll({ where: { lucky_draw_id: draw.id } });
    if (entries.length === 0) {
      return res.status(400).json({ error: 'Cannot roll winners. No participants have entered this draw.' });
    }

    // Weighted selection (unique users only)
    const winnerEntriesSelected = [];
    const winnersCountToSelect = Math.min(draw.winners_count || 1, entries.length);
    let remainingEntries = [...entries];
    const selectedUserIds = new Set();

    for (let i = 0; i < winnersCountToSelect; i++) {
      if (remainingEntries.length === 0) break;
      const randomIndex = Math.floor(Math.random() * remainingEntries.length);
      const chosenEntry = remainingEntries[randomIndex];
      
      if (!selectedUserIds.has(chosenEntry.user_id)) {
        winnerEntriesSelected.push(chosenEntry);
        selectedUserIds.add(chosenEntry.user_id);
        remainingEntries = remainingEntries.filter(e => e.user_id !== chosenEntry.user_id);
      } else {
        remainingEntries.splice(randomIndex, 1);
        i--;
      }
    }

    // Record Winners
    for (let rankIndex = 0; rankIndex < winnerEntriesSelected.length; rankIndex++) {
      const winnerEntry = winnerEntriesSelected[rankIndex];
      const rank = rankIndex + 1;

      await LuckyDrawWinner.create({
        lucky_draw_id: draw.id,
        user_id: winnerEntry.user_id,
        prize_won: draw.prize_amount,
        rank: rank,
        status: draw.prize_type === 'coins' ? 'paid' : 'pending'
      }, { transaction: t });

      if (draw.prize_type === 'coins' && draw.prize_value > 0) {
        const user = await User.findOne({ where: { telegram_id: winnerEntry.user_id } });
        if (user) {
          await user.update({
            balance: user.balance + draw.prize_value,
            total_earned: user.total_earned + draw.prize_value
          }, { transaction: t });

          await Transaction.create({
            telegram_id: user.telegram_id,
            amount: draw.prize_value,
            type: 'lucky_draw_win',
            description: `Won ${draw.prize_amount} in "${draw.title}"!`,
            reference_id: `LD-MANUAL-${draw.id}-${rank}`,
            status: 'completed'
          }, { transaction: t });
        }
      }
    }

    await draw.update({ status: 'ended' }, { transaction: t });
    await t.commit();

    res.json({ success: true, message: 'Winners rolled and rewarded successfully!' });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: err.message });
  }
});

// 7. PUT /api/admin/lucky-draws/winners/:id - Mark prize as delivered/paid
router.put('/lucky-draws/winners/:id', adminAuth, async (req, res) => {
  try {
    const winner = await LuckyDrawWinner.findByPk(req.params.id);
    if (!winner) return res.status(404).json({ error: 'Winner entry not found' });
    
    const { status, proof_image } = req.body;
    if (status !== undefined) winner.status = status;
    if (proof_image !== undefined) winner.proof_image = proof_image;
    
    await winner.save();
    res.json({ success: true, winner });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. GET /api/admin/lucky-draws/stats - Metrics overview
router.get('/lucky-draws/stats', adminAuth, async (req, res) => {
  try {
    const totalDraws = await LuckyDraw.count();
    const totalEntries = await LuckyDrawEntry.count();
    const totalParticipants = await LuckyDrawEntry.count({ distinct: true, col: 'user_id' });
    const adEntries = await LuckyDrawEntry.count({ where: { entry_source: 'ad' } });
    const coinEntries = await LuckyDrawEntry.count({ where: { entry_source: 'coins' } });
    
    // Estimate ad revenue based on eCPM of $2 per 1000 views
    const revenueEstimate = ((adEntries * 2) / 1000).toFixed(2);

    res.json({
      totalDraws,
      totalEntries,
      totalParticipants,
      adEntries,
      coinEntries,
      revenueEstimate
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
