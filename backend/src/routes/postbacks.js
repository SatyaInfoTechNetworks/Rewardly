const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { sequelize } = require('../config/database');

/**
 * CPX Research Postback
 * Automatically credits coins to the user on survey completion
 */
router.get('/cpx', async (req, res) => {
  const { user_id, amount_local, trans_id, status } = req.query;

  console.log(`📥 CPX Postback Received: User=${user_id}, Amount=${amount_local}, Trans=${trans_id}`);

  if (status !== '1' && status !== 'done') {
    return res.send('OK'); // Still return OK to CPX to acknowledge receipt
  }

  const t = await sequelize.transaction();

  try {
    // 1. Check if transaction already processed
    const existing = await Transaction.findOne({ where: { external_id: trans_id } });
    if (existing) {
      return res.send('OK'); // Already handled
    }

    // 2. Find User
    const user = await User.findByPk(user_id);
    if (!user) {
      console.error(`❌ User ${user_id} not found for postback`);
      return res.status(404).send('User not found');
    }

    // 3. Update Balance
    const rewardAmount = parseInt(amount_local);
    await user.update({ balance: user.balance + rewardAmount }, { transaction: t });

    // 4. Record Transaction
    await Transaction.create({
      telegram_id: user_id,
      amount: rewardAmount,
      type: 'survey',
      description: 'CPX Research Survey Reward',
      external_id: trans_id,
      status: 'completed'
    }, { transaction: t });

    await t.commit();
    const { trackContestActivity } = require('../utils/contestTracker');
    await trackContestActivity(user_id, 'earning', rewardAmount);

    console.log(`✅ User ${user_id} credited with ${rewardAmount} coins.`);
    return res.send('OK');
  } catch (error) {
    await t.rollback();
    console.error('❌ CPX Postback Error:', error);
    return res.status(500).send('Internal Error');
  }
});

module.exports = router;
