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

/**
 * Monetag Postback
 * Credits coins for Monetag ad events (Rewarded, Push, etc.)
 */
router.get('/monetag', async (req, res) => {
  const { user_id, event, reward, price, trans_id } = req.query;

  console.log(`📥 Monetag Postback: User=${user_id}, Event=${event}, Reward=${reward}, Trans=${trans_id}`);

  // Only credit if it's a rewardable event
  if (reward !== 'yes') {
    return res.send('OK');
  }

  const t = await sequelize.transaction();

  try {
    const existing = await Transaction.findOne({ where: { external_id: trans_id } });
    if (existing) return res.send('OK');

    const user = await User.findByPk(user_id);
    if (!user) return res.status(404).send('User not found');

    // Reward calculation: for now fixed 5 coins or based on price?
    // Let's use a default or logic based on event type
    const rewardAmount = 5; 
    
    await user.update({ balance: user.balance + rewardAmount }, { transaction: t });

    await Transaction.create({
      user_id: user_id,
      amount: rewardAmount,
      type: 'ad',
      description: `Monetag Ad Reward (${event})`,
      external_id: trans_id,
      status: 'completed'
    }, { transaction: t });

    await t.commit();

    const { trackContestActivity } = require('../utils/contestTracker');
    await trackContestActivity(user_id, 'earning', rewardAmount);

    return res.send('OK');
  } catch (error) {
    if (t) await t.rollback();
    console.error('❌ Monetag Postback Error:', error);
    return res.status(500).send('Internal Error');
  }
});

/**
 * AdsGram Postback
 * Credits coins for AdsGram rewarded ads via S2S
 */
router.get('/adsgram', async (req, res) => {
  const { user_id } = req.query;

  console.log(`📥 AdsGram Postback: User=${user_id}`);

  if (!user_id) return res.status(400).send('Missing user_id');

  const t = await sequelize.transaction();

  try {
    const user = await User.findByPk(user_id);
    if (!user) {
      console.error(`❌ AdsGram User ${user_id} not found`);
      return res.status(404).send('User not found');
    }

    const rewardAmount = 5; 
    
    // Update Balance
    await user.update({ balance: user.balance + rewardAmount }, { transaction: t });

    // Record Transaction
    await Transaction.create({
      telegram_id: user_id,
      amount: rewardAmount,
      type: 'game',
      description: 'AdsGram S2S Reward',
      status: 'completed'
    }, { transaction: t });

    await t.commit();

    const { trackContestActivity } = require('../utils/contestTracker');
    await trackContestActivity(user_id, 'earning', rewardAmount);

    console.log(`✅ AdsGram Reward: User ${user_id} credited with ${rewardAmount} coins.`);
    return res.send('OK');
  } catch (error) {
    if (t) await t.rollback();
    console.error('❌ AdsGram Postback Error:', error);
    return res.status(500).send('Internal Error');
  }
});

module.exports = router;
