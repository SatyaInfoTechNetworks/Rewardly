const express = require('express');
const router = express.Router();
const PayoutMethod = require('../models/PayoutMethod');
const PayoutTier = require('../models/PayoutTier');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { generateTransactionId } = require('../utils/transactions');

/**
 * GET /api/payouts
 * Fetch all active payout methods with tiers
 */
router.get('/', async (req, res) => {
  try {
    const methods = await PayoutMethod.findAll({
      where: { status: 'active' },
      include: [{ model: PayoutTier, as: 'tiers' }],
      order: [
        ['order_index', 'ASC'],
        [{ model: PayoutTier, as: 'tiers' }, 'coins_required', 'ASC']
      ]
    });
    res.json(methods);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/payouts/withdraw
 * Create a new withdrawal request
 */
router.post('/withdraw', async (req, res) => {
  try {
    const { method_id, tier_id, payout_details } = req.body;
    let telegramId = req.headers['x-telegram-id'];
    const initData = req.headers['x-telegram-init-data'];

    if (initData) {
      try {
        const urlParams = new URLSearchParams(initData);
        const userStr = urlParams.get('user');
        if (userStr) {
          const tgUser = JSON.parse(userStr);
          if (tgUser && tgUser.id) {
            telegramId = tgUser.id;
          }
        }
      } catch (err) {
        console.error('Failed to parse initData in withdraw:', err.message);
      }
    }

    if (!telegramId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await User.findOne({ where: { telegram_id: telegramId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const tier = await PayoutTier.findByPk(tier_id);
    if (!tier) return res.status(404).json({ error: 'Payout tier not found' });

    if (user.balance < tier.coins_required) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Create the request
    const withdrawal = await WithdrawalRequest.create({
      user_id: user.telegram_id,
      payout_method_id: method_id,
      payout_tier_id: tier_id,
      amount_text: tier.amount_text,
      coins_used: tier.coins_required,
      payout_details: payout_details,
      status: 'pending'
    });

    const method = await PayoutMethod.findByPk(method_id);
    const methodName = method ? method.name : 'Payout';

    // Create the transaction record for the user's history
    const transactionId = generateTransactionId('WDR');
    await Transaction.create({
      telegram_id: user.telegram_id,
      reference_id: transactionId,
      amount: -tier.coins_required,
      type: 'withdrawal',
      description: `Redeemed ${tier.amount_text} via ${methodName}`,
      status: 'pending',
      external_id: withdrawal.id.toString()
    });

    // Deduct balance and move to pending
    await user.update({
      balance: user.balance - tier.coins_required,
      pending_balance: (user.pending_balance || 0) + tier.coins_required
    });

    res.json({ success: true, withdrawal_id: withdrawal.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
