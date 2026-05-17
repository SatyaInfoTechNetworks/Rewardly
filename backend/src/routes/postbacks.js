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

    // Send Telegram Alert to Admin
    const { sendCompletionAlert } = require('../utils/telegramAlerter');
    sendCompletionAlert({
      offerName: 'CPX Research Survey',
      offerwall: 'CPX Research',
      amount: rewardAmount,
      transactionId: trans_id,
      username: user.username,
      firstName: user.first_name,
      telegramId: user_id
    });

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
      description: 'Watch Ads Reward',
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
router.get(/^\/pubscale(\/.*)?$/, async (req, res) => {
  const { user_id, value, token, signature, offer_name, status } = req.query;
  const SECRET_KEY = '0b31d194-c610-46fa-b32a-4fb2c82c0304';

  console.log(`📥 PubScale Postback: User=${user_id}, Value=${value}, Token=${token}`);

  // 0. Safety Check
  if (!user_id || !token || !value) {
    console.error('❌ PubScale Postback: Missing required parameters');
    return res.status(400).send('Missing Parameters');
  }

  // 1. Signature Verification
  try {
    const amountInt = Math.floor(parseFloat(value));
    const template = `${SECRET_KEY}.${user_id}.${amountInt}.${token}`;
    const calculatedSig = crypto.createHash('md5').update(template).digest('hex');

    if (calculatedSig !== signature) {
      console.error(`❌ PubScale Signature Mismatch! Expected ${calculatedSig}, got ${signature}`);
      if (process.env.NODE_ENV === 'production') {
        return res.status(401).send('Invalid Signature');
      }
    }
  } catch (sigErr) {
    console.error('Signature Calc Error:', sigErr);
  }

  // 2. Status check for completions (if provided)
  if (status && status !== '1' && status !== 'approved' && status !== 'completed') {
    return res.send('OK');
  }

  const t = await sequelize.transaction();

  try {
    // 3. Check if transaction already processed (token is the transaction_id)
    const existing = await Transaction.findOne({ where: { external_id: token } });
    if (existing) return res.send('OK');

    // 4. Find User
    const user = await User.findByPk(user_id);
    if (!user) {
      console.error(`❌ PubScale User ${user_id} not found`);
      return res.status(404).send('User not found');
    }

    // 5. Update Balance
    const rewardAmount = Math.floor(parseFloat(value));
    await user.update({ balance: user.balance + rewardAmount }, { transaction: t });

    // 6. Record Transaction
    await Transaction.create({
      telegram_id: user_id,
      amount: rewardAmount,
      type: 'offerwall',
      description: offer_name ? `PubScale: ${offer_name}` : 'PubScale Offer Completion',
      external_id: token,
      status: 'completed'
    }, { transaction: t });

    await t.commit();

    // 7. Post-reward processing
    await trackContestActivity(user_id, 'earnings', rewardAmount);
    await validateReferral(user_id);

    // Send Telegram Alert to Admin
    const { sendCompletionAlert } = require('../utils/telegramAlerter');
    sendCompletionAlert({
      offerName: offer_name || 'PubScale Offer Completion',
      offerwall: 'PubScale WOW',
      amount: rewardAmount,
      transactionId: token,
      username: user.username,
      firstName: user.first_name,
      telegramId: user_id
    });

    console.log(`✅ PubScale Reward: User ${user_id} credited with ${rewardAmount} coins.`);
    return res.send('OK');
  } catch (error) {
    if (t) await t.rollback();
    console.error('❌ PubScale Postback Error:', error);
    return res.status(500).send('Internal Error');
  }
});

router.get(/^\/pubscale-chargeback(\/.*)?$/, async (req, res) => {
  const { user_id, value, token, signature, offer_name } = req.query;
  const SECRET_KEY = '0b31d194-c610-46fa-b32a-4fb2c82c0304';

  console.log(`⚠️ PubScale Chargeback Attempt: User=${user_id}, Token=${token}, Value=${value}`);

  // 1. Signature Verification
  try {
    const amountInt = Math.floor(parseFloat(value));
    const template = `${SECRET_KEY}.${user_id}.${amountInt}.${token}`;
    const calculatedSig = crypto.createHash('md5').update(template).digest('hex');

    if (calculatedSig !== signature) {
      console.error(`❌ PubScale Chargeback Sig Mismatch! Expected ${calculatedSig}, got ${signature}`);
      if (process.env.NODE_ENV === 'production') {
        return res.status(401).send('Invalid Signature');
      }
    }
  } catch (sigErr) {
    console.error('Signature Calc Error:', sigErr);
  }

  const t = await sequelize.transaction();

  try {
    const existing = await Transaction.findOne({ where: { external_id: token } });
    
    if (!existing) {
      console.warn(`ℹ️ PubScale Chargeback: Original transaction ${token} not found in database. Still creating reversal record.`);
      // We still create the record and deduct balance if user exists
      const user = await User.findByPk(user_id);
      if (user) {
        const rewardAmount = Math.floor(parseFloat(value));
        await user.update({ balance: user.balance - rewardAmount }, { transaction: t });
        
        await Transaction.create({
          telegram_id: user_id,
          amount: -rewardAmount,
          type: 'offerwall',
          description: offer_name ? `FRAUD REVERSAL: ${offer_name}` : 'PubScale Fraud Reversal',
          external_id: `rev_${token}`,
          status: 'completed'
        }, { transaction: t });
      }
    } else {
      if (existing.status === 'failed') {
        await t.rollback();
        return res.send('OK'); // Already reversed
      }

      const user = await User.findByPk(user_id);
      if (user) {
        await user.update({ balance: user.balance - existing.amount }, { transaction: t });
      }

      await existing.update({ status: 'failed' }, { transaction: t });

      await Transaction.create({
        telegram_id: user_id,
        amount: -existing.amount,
        type: 'offerwall',
        description: `FRAUD REVERSAL: ${existing.description}`,
        external_id: `rev_${token}`,
        status: 'completed'
      }, { transaction: t });
    }
    
    await t.commit();
    console.log(`✅ PubScale Chargeback Processed Successfully for User ${user_id}`);
    return res.send('OK');
  } catch (err) {
    if (t) await t.rollback();
    console.error('❌ PubScale Chargeback Error:', err);
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

/**
 * AdsGram Lucky Draw & Contest Postback
 * Automatically registers an ad-based ticket entry for the active Lucky Draw upon ad view.
 * Mounted at: GET /api/postbacks/adsgram-draw
 */
router.get('/adsgram-draw', async (req, res) => {
  const user_id = req.query.user_id || req.query.userId || req.query.tgid || req.query.tg_id;
  
  console.log(`📥 [AdsGram Draw Postback] User received: ${user_id}`);

  if (!user_id) {
    console.error('[AdsGram Draw Postback] Missing user_id from query:', req.query);
    return res.status(400).send('Missing user_id');
  }

  // Validate numeric format (Telegram ID)
  if (isNaN(Number(user_id))) {
    console.error(`❌ [AdsGram Draw Postback] Invalid non-numeric user_id: "${user_id}". The macro in your AdsGram dashboard must be written as [userId]!`);
    return res.status(400).send('Invalid user_id format. Use [userId] macro.');
  }

  const t = await sequelize.transaction();

  try {
    const User = require('../models/User');
    const LuckyDraw = require('../models/LuckyDraw');
    const LuckyDrawEntry = require('../models/LuckyDrawEntry');

    const user = await User.findByPk(user_id);
    if (!user) {
      console.error(`❌ [AdsGram Draw Postback] User ${user_id} not found`);
      await t.rollback();
      return res.status(404).send('User not found');
    }

    // Find the latest active lucky draw that allows ad entries
    const activeDraw = await LuckyDraw.findOne({
      where: { status: 'active', ad_entries_enabled: true },
      order: [['created_at', 'DESC']]
    });

    if (!activeDraw) {
      console.warn(`⚠️ [AdsGram Draw Postback] No active Lucky Draw accepting ad entries found for User ${user_id}`);
      await t.rollback();
      return res.send('OK'); // Acknowledge to AdsGram so they do not retry
    }

    // Check entry limits for this user
    const totalEntries = await LuckyDrawEntry.count({
      where: { lucky_draw_id: activeDraw.id, user_id: user.telegram_id }
    });

    const adEntries = await LuckyDrawEntry.count({
      where: { lucky_draw_id: activeDraw.id, user_id: user.telegram_id, entry_source: 'ad' }
    });

    if (totalEntries >= activeDraw.max_entries_per_user) {
      console.warn(`⚠️ [AdsGram Draw Postback] User ${user_id} reached global limit (${activeDraw.max_entries_per_user}) for Draw ${activeDraw.id}`);
      await t.rollback();
      return res.send('OK');
    }

    if (adEntries >= activeDraw.max_ad_entries) {
      console.warn(`⚠️ [AdsGram Draw Postback] User ${user_id} reached ad-specific limit (${activeDraw.max_ad_entries}) for Draw ${activeDraw.id}`);
      await t.rollback();
      return res.send('OK');
    }

    // Create a new entry ticket
    const entry = await LuckyDrawEntry.create({
      lucky_draw_id: activeDraw.id,
      user_id: user.telegram_id,
      entry_source: 'ad'
    }, { transaction: t });

    // Create an audit transaction log with 0 coins
    await Transaction.create({
      telegram_id: user.telegram_id,
      amount: 0,
      type: 'lucky_draw_entry',
      description: `Ad entry ticket registered for "${activeDraw.title}"`,
      reference_id: `LD-AD-${activeDraw.id}-${Date.now()}`,
      status: 'completed'
    }, { transaction: t });

    await t.commit();
    console.log(`✅ [AdsGram Draw Postback Success] User ${user_id} registered Draw Entry for "${activeDraw.title}"`);
    return res.send('OK');

  } catch (err) {
    await t.rollback();
    console.error('❌ [AdsGram Draw Postback Error]', err);
    return res.status(500).send('Internal Error');
  }
});

module.exports = router;
