const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const axios = require('axios');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { generateTransactionId } = require('../utils/transactions');

// Opinion Universe Credentials
const CONFIG = {
  KEY: '919b7de84581a94fffc10ee0d0f3b4da89e6f8b18bb6e8bb',
  PUBID: '1863',
  APP_ID: 'ID_eb1f5bea3e8caadcfcf6ccb5d35a1d1d',
  BASE_URL: 'https://api.opinionuniverse.com/publisher/offersFeed'
};

/**
 * GET /api/opinion-universe/test
 */
router.get('/test', async (req, res) => {
  try {
    const { country = 'IN', platform = 'All' } = req.query;

    const params = {
      key: CONFIG.KEY,
      pubid: CONFIG.PUBID,
      app_id: CONFIG.APP_ID,
      country: country,
      platform: platform,
      type: 'live_surveys'
    };

    console.log('[OpinionUniverse] Fetching offers with params:', params);

    const response = await axios.get(CONFIG.BASE_URL, { 
      params,
      timeout: 10000 // 10s timeout
    });
    
    console.log('[OpinionUniverse] Success! Found', response.data?.data?.response?.offers?.length || 0, 'offers');
    res.json(response.data);
  } catch (err) {
    console.error('[OpinionUniverse] Error fetching offers:', err.message);
    if (err.response) {
      console.error('[OpinionUniverse] API Response Error:', err.response.data);
    }
    
    res.status(err.response?.status || 500).json({ 
      error: 'Failed to fetch offers', 
      message: err.message,
      details: err.response?.data
    });
  }
});

/**
 * GET /api/opinion-universe/postback
 * Expected URL: /api/opinion-universe/postback?user_id={SID}&amount={PAYOUT}&status={STATUS}&offer_id={OFFERID}&trans_id={TransactionID}
 */
router.get('/postback', async (req, res) => {
  try {
    const { user_id, amount, status, offer_id, trans_id, sig } = req.query;
    
    console.log('[OpinionUniverse] Postback received:', { user_id, amount, status, offer_id, trans_id, sig });

    // 0. Signature Verification (Security)
    const secret = process.env.OU_POSTBACK_SECRET;
    if (secret && sig && trans_id) {
      const calculatedHash = crypto.createHmac("sha256", secret).update(trans_id).digest("hex");
      if (calculatedHash !== sig) {
        console.error('[OpinionUniverse] Security Alert: Invalid postback signature!');
        return res.send('0');
      }
      console.log('[OpinionUniverse] Signature verified successfully.');
    }

    // Status 1 = Completed, Status 2 = Reversal
    if (status === '2') {
       console.log('[OpinionUniverse] Reversal received:', trans_id);
       
       const reward = Math.floor(parseFloat(amount));
       
       // Deduct from user balance (allow negative as requested)
       user.balance = parseInt(user.balance) - reward;
       await user.save();

       // Update existing transaction if found
       const existing = await Transaction.findOne({ where: { reference_id: trans_id } });
       if (existing) {
          await existing.update({ 
            status: 'reversed', 
            description: `${existing.description} (REVERSED)` 
          });
       } else {
          // Create a reversal transaction if original wasn't found
          await Transaction.create({
            telegram_id: user.telegram_id,
            reference_id: `REV-${trans_id || Date.now()}`,
            amount: -reward,
            type: 'survey',
            description: `Opinion Universe Reversal: ${offer_id || 'N/A'}`,
            status: 'completed'
          });
       }

       console.log(`❌ [OpinionUniverse] Reversal: Deducted ${reward} coins from user ${user_id}`);
       return res.send('1');
    }

    if (status !== '1') {
       console.log('[OpinionUniverse] Postback ignored (status):', status);
       return res.send('1'); // Return 1 to acknowledge
    }

    if (!user_id || !amount) {
      console.error('[OpinionUniverse] Missing user_id or amount');
      return res.send('0');
    }

    const user = await User.findByPk(user_id);
    if (!user) {
      console.error('[OpinionUniverse] User not found:', user_id);
      return res.send('0');
    }

    const reward = Math.floor(parseFloat(amount));
    
    // 1. Check for duplicate transaction
    const existing = await Transaction.findOne({ where: { reference_id: trans_id } });
    if (existing && trans_id) {
       console.log('[OpinionUniverse] Duplicate postback detected:', trans_id);
       return res.send('1');
    }

    // 2. Update user balance
    user.balance = parseInt(user.balance) + reward;
    await user.save();

    // 3. Create Transaction record
    await Transaction.create({
      telegram_id: user.telegram_id,
      reference_id: trans_id || generateTransactionId('OU'),
      amount: reward,
      type: 'survey',
      description: `Opinion Universe Offer: ${offer_id || 'N/A'}`,
      status: 'completed'
    });

    console.log(`✅ [OpinionUniverse] Success: User ${user_id} awarded ${reward} coins`);
    
    // Opinion Universe expects a response body of '1'
    res.send('1');
  } catch (err) {
    console.error('[OpinionUniverse] Postback Critical Error:', err.message);
    res.status(200).send('0'); // Return 0 on error so they retry
  }
});

module.exports = router;
