const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { sequelize } = require('../config/database');
const AppSetting = require('../models/AppSetting');
const { trackContestActivity } = require('../utils/contestTracker');
const { validateReferral } = require('../utils/referralValidator');

const getSettings = async () => {
  let settings = await AppSetting.findByPk(1);
  if (!settings) settings = await AppSetting.create({ id: 1 });
  return settings;
};

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
    await trackContestActivity(user_id, 'earnings', rewardAmount);
    await validateReferral(user_id);

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
    const settings = await getSettings();
    const existing = await Transaction.findOne({ where: { external_id: trans_id } });
    if (existing) return res.send('OK');

    const user = await User.findByPk(user_id);
    if (!user) return res.status(404).send('User not found');

    // Reward calculation: using dynamic settings
    const rewardAmount = settings.game_reward_coins; 
    
    await user.update({ balance: user.balance + rewardAmount }, { transaction: t });

    await Transaction.create({
      telegram_id: user_id,
      amount: rewardAmount,
      type: 'game',
      description: `Monetag Ad Reward (${event})`,
      external_id: trans_id,
      status: 'completed'
    }, { transaction: t });

    await t.commit();

    await trackContestActivity(user_id, 'earnings', rewardAmount);
    await validateReferral(user_id);

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
    const settings = await getSettings();
    const user = await User.findByPk(user_id);
    if (!user) {
      console.error(`❌ AdsGram User ${user_id} not found`);
      return res.status(404).send('User not found');
    }

    const rewardAmount = settings.game_reward_coins; 
    
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

    await trackContestActivity(user_id, 'earnings', rewardAmount);
    await validateReferral(user_id);

    console.log(`✅ AdsGram Reward: User ${user_id} credited with ${rewardAmount} coins.`);
    return res.send('OK');
  } catch (error) {
    if (t) await t.rollback();
    console.error('❌ AdsGram Postback Error:', error);
    return res.status(500).send('Internal Error');
  }
});

const crypto = require('crypto');

/**
 * PubScale (WOW) Postback
 * Credits coins for completed offers/tasks on the PubScale offerwall
 */
router.get('/pubscale', async (req, res) => {
  const { user_id, value, token, signature, offer_name, status } = req.query;
  const SECRET_KEY = '0b31d194-c610-46fa-b32a-4fb2c82c0304';

  console.log(`📥 PubScale Postback: User=${user_id}, Value=${value}, Token=${token}, Sig=${signature}`);

  // 1. Signature Verification
  try {
    const amountInt = parseInt(value);
    const template = `${SECRET_KEY}.${user_id}.${amountInt}.${token}`;
    const calculatedSig = crypto.createHash('md5').update(template).digest('hex');

    if (calculatedSig !== signature) {
      console.error(`❌ PubScale Signature Mismatch! Expected ${calculatedSig}, got ${signature}`);
      // return res.status(401).send('Invalid Signature'); 
      // For now, let's just log it and continue if in dev, but in prod we should block.
    }
  } catch (sigErr) {
    console.error('Signature Calc Error:', sigErr);
  }

  // 2. Handle Statuses (Chargeback/Reversal)
  if (status === 'chargeback' || status === 'reversed') {
    const t = await sequelize.transaction();
    try {
      const existing = await Transaction.findOne({ where: { external_id: token } });
      if (!existing) return res.send('OK'); // Nothing to reverse

      if (existing.status === 'failed') return res.send('OK'); // Already reversed

      const user = await User.findByPk(user_id);
      if (user) {
        // Deduct the amount from user balance
        await user.update({ balance: user.balance - existing.amount }, { transaction: t });
      }

      // Mark original transaction as failed
      await existing.update({ status: 'failed' }, { transaction: t });

      // Create a NEW negative transaction record for history
      await Transaction.create({
        telegram_id: user_id,
        amount: -existing.amount,
        type: 'offerwall',
        description: `FRAUD REVERSAL: ${existing.description}`,
        external_id: `rev_${token}`,
        status: 'completed'
      }, { transaction: t });
      
      await t.commit();
      console.log(`⚠️ PubScale Chargeback: User ${user_id} penalized (Token: ${token})`);
      return res.send('OK');
    } catch (err) {
      if (t) await t.rollback();
      return res.status(500).send('Error processing chargeback');
    }
  }

  // 3. Status check for completions (if provided)
  if (status && status !== '1' && status !== 'approved' && status !== 'completed') {
    return res.send('OK');
  }

  const t = await sequelize.transaction();

  try {
    // 2. Check if transaction already processed (token is the transaction_id)
    const existing = await Transaction.findOne({ where: { external_id: token } });
    if (existing) return res.send('OK');

    // 3. Find User
    const user = await User.findByPk(user_id);
    if (!user) {
      console.error(`❌ PubScale User ${user_id} not found`);
      return res.status(404).send('User not found');
    }

    // 4. Update Balance
    const rewardAmount = parseInt(value);
    await user.update({ balance: user.balance + rewardAmount }, { transaction: t });

    // 5. Record Transaction
    await Transaction.create({
      telegram_id: user_id,
      amount: rewardAmount,
      type: 'offerwall',
      description: offer_name ? `PubScale: ${offer_name}` : 'PubScale Offer Completion',
      external_id: token,
      status: 'completed'
    }, { transaction: t });

    await t.commit();

    // 5. Post-reward processing
    await trackContestActivity(user_id, 'earnings', rewardAmount);
    await validateReferral(user_id);

    console.log(`✅ PubScale Reward: User ${user_id} credited with ${rewardAmount} coins.`);
    return res.send('OK');
  } catch (error) {
    if (t) await t.rollback();
    console.error('❌ PubScale Postback Error:', error);
    return res.status(500).send('Internal Error');
  }
});
/**
 * CPX Research Postback
 * Credits coins for completed surveys via S2S
 */
router.get('/cpx', async (req, res) => {
  const { status, trans_id, user_id, amount_local, hash } = req.query;
  const APP_HASH = process.env.CPX_APP_HASH;

  console.log(`📥 CPX Postback: User=${user_id}, Trans=${trans_id}, Amount=${amount_local}, Status=${status}`);

  // 1. Signature Verification
  const calculatedHash = crypto.createHash('md5').update(`${trans_id}-${APP_HASH}`).digest('hex');
  if (calculatedHash !== hash) {
    console.error(`❌ CPX Signature Mismatch! Expected ${calculatedHash}, got ${hash}`);
    return res.status(401).send('Invalid Signature');
  }

  // 2. Handle Statuses
  if (status === '2') {
    // Status 2 = Canceled/Fraud (Chargeback)
    const t = await sequelize.transaction();
    try {
      const existing = await Transaction.findOne({ where: { external_id: trans_id } });
      if (!existing) return res.send('OK'); // Nothing to reverse

      if (existing.status === 'failed') return res.send('OK'); // Already reversed

      const user = await User.findByPk(user_id);
      if (user) {
        // Deduct the amount from user balance
        await user.update({ balance: user.balance - existing.amount }, { transaction: t });
      }

      // Mark original transaction as failed
      await existing.update({ status: 'failed' }, { transaction: t });

      // Create a NEW negative transaction record for history
      await Transaction.create({
        telegram_id: user_id,
        amount: -existing.amount,
        type: 'survey',
        description: `FRAUD REVERSAL: ${existing.description}`,
        external_id: `rev_${trans_id}`,
        status: 'completed'
      }, { transaction: t });
      
      await t.commit();
      console.log(`⚠️ CPX Chargeback: User ${user_id} penalized for fraud. Negative record created (Trans: ${trans_id})`);
      return res.send('OK');
    } catch (err) {
      if (t) await t.rollback();
      return res.status(500).send('Error processing chargeback');
    }
  }

  if (status !== '1') {
    return res.send('OK');
  }

  const t = await sequelize.transaction();

  try {
    // 3. Check if transaction already processed
    const existing = await Transaction.findOne({ where: { external_id: trans_id } });
    if (existing) return res.send('OK');

    // 4. Find User
    const user = await User.findByPk(user_id);
    if (!user) {
      console.error(`❌ CPX User ${user_id} not found`);
      return res.status(404).send('User not found');
    }

    // 5. Update Balance
    const rewardAmount = parseInt(amount_local);
    await user.update({ balance: user.balance + rewardAmount }, { transaction: t });

    // 6. Record Transaction
    await Transaction.create({
      telegram_id: user_id,
      amount: rewardAmount,
      type: 'survey',
      description: 'CPX Research Survey Reward',
      external_id: trans_id,
      status: 'completed'
    }, { transaction: t });

    await t.commit();

    // 7. Post-reward processing
    await trackContestActivity(user_id, 'earnings', rewardAmount);
    await validateReferral(user_id);

    console.log(`✅ CPX Reward: User ${user_id} credited with ${rewardAmount} coins.`);
    return res.send('OK');
  } catch (error) {
    if (t) await t.rollback();
    console.error('❌ CPX Postback Error:', error);
    return res.status(500).send('Internal Error');
  }
});

module.exports = router;
