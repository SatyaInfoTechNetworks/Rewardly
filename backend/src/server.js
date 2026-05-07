require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { validateTelegramInitData } = require('./utils/telegramAuth');
const { sequelize, testConnection } = require('./config/database');
const User = require('./models/User');
const PayoutMethod = require('./models/PayoutMethod');
const PayoutTier = require('./models/PayoutTier');
const WithdrawalRequest = require('./models/WithdrawalRequest');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for Dokploy/Nginx to get real IP
app.set('trust proxy', true);

// Utility to get real IP
const getClientIp = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
};

// Model Associations
PayoutMethod.hasMany(PayoutTier, { as: 'tiers', foreignKey: 'payout_method_id' });
PayoutTier.belongsTo(PayoutMethod, { foreignKey: 'payout_method_id' });

WithdrawalRequest.belongsTo(User, { foreignKey: 'user_id' });
WithdrawalRequest.belongsTo(PayoutMethod, { foreignKey: 'payout_method_id' });
WithdrawalRequest.belongsTo(PayoutTier, { foreignKey: 'payout_tier_id' });

// Test DB Connection & Sync Models
testConnection().then(() => {
  sequelize.sync({ alter: true }).then(async () => {
    console.log('✨ Database models synchronized.');
    
    // Auto-Seed Dummy Users for Testing
    try {
      await User.findOrCreate({ where: { telegram_id: 111111 }, defaults: { first_name: 'Satya (Test)', balance: 5000, is_phone_verified: true } });
      await User.findOrCreate({ where: { telegram_id: 222222 }, defaults: { first_name: 'Rahul (Test)', balance: 2450, is_channel_joined: true } });
      await User.findOrCreate({ where: { telegram_id: 333333 }, defaults: { first_name: 'Priya (Test)', balance: 120, google_aid: 'TEST-ID-999' } });
      
      // Auto-Seed Payout Methods
      const [upi] = await PayoutMethod.findOrCreate({ 
        where: { name: 'UPI' }, 
        defaults: { logo_url: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg', order_index: 1 } 
      });
      await PayoutTier.findOrCreate({ where: { payout_method_id: upi.id, coins_required: 5000 }, defaults: { amount_text: '₹50' } });
      await PayoutTier.findOrCreate({ where: { payout_method_id: upi.id, coins_required: 10000 }, defaults: { amount_text: '₹100' } });

      const [amazon] = await PayoutMethod.findOrCreate({ 
        where: { name: 'Amazon Pay' }, 
        defaults: { logo_url: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg', order_index: 2 } 
      });
      const [amazonTier] = await PayoutTier.findOrCreate({ where: { payout_method_id: amazon.id, coins_required: 25000 }, defaults: { amount_text: '₹250' } });

      // Sample Withdrawal Requests
      await WithdrawalRequest.findOrCreate({
        where: { user_id: 111111, payout_method_id: upi.id },
        defaults: {
          payout_tier_id: 1,
          amount_text: '₹50',
          coins_used: 5000,
          payout_details: 'satya@upi',
          status: 'pending'
        }
      });

      await WithdrawalRequest.findOrCreate({
        where: { user_id: 222222, payout_method_id: amazon.id },
        defaults: {
          payout_tier_id: amazonTier.id,
          amount_text: '₹250',
          coins_used: 25000,
          payout_details: 'rahul@amazon',
          status: 'pending'
        }
      });

    } catch (e) {
      console.log('Seed skip:', e.message);
    }
  });
});

// Middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-secret');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(bodyParser.json());

// Routes
app.use('/api/surveys', require('./routes/surveys'));
app.use('/api/postbacks', require('./routes/postbacks'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/payouts', require('./routes/payouts'));

app.get('/', (req, res) => {
  res.json({ message: 'Rewardly Backend API is running' });
});

/**
 * POST /api/webhook
 * Listen for Telegram Bot updates (Phone Sharing, etc.)
 */
app.post('/api/webhook', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.sendStatus(200);

  // 1. HANDLE REFERRALS FROM BOT START (e.g., /start 12345)
  if (message.text && message.text.startsWith('/start ')) {
    const referralCode = message.text.split(' ')[1];
    if (referralCode) {
      try {
        const [user, created] = await User.findOrCreate({
          where: { telegram_id: message.from.id },
          defaults: {
            username: message.from.username,
            first_name: message.from.first_name,
            last_name: message.from.last_name,
            referred_by: parseInt(referralCode)
          }
        });

        if (!created && !user.referred_by) {
          await user.update({ referred_by: parseInt(referralCode) });
        }
        console.log(`🎁 Webhook Referral: User ${message.from.id} invited by ${referralCode}`);
      } catch (err) {
        console.error('Webhook Referral Error:', err);
      }
    }
  }

  // 2. HANDLE PHONE VERIFICATION (Contact Sharing)
  if (message.contact) {
    const { phone_number, user_id } = message.contact;
    try {
      const user = await User.findOne({ where: { telegram_id: user_id } });
      if (user) {
        user.phone_number = phone_number;
        user.is_phone_verified = true;
        await user.save();
        console.log(`✅ Webhook: Verified phone for ${user.first_name}`);
      }
    } catch (err) {
      console.error('Webhook Error:', err);
    }
  }

  res.sendStatus(200);
});

/**
 * Health Check & Auth Sync
 * Securely validates and syncs the Telegram user data
 */
app.post('/api/auth/sync', async (req, res) => {
  const { initData } = req.body;
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

  // Validate TMA InitData
  const isValid = validateTelegramInitData(initData, BOT_TOKEN);
  
  console.log('🔐 Auth Attempt:', { 
    hasInitData: !!initData, 
    isValid, 
    env: process.env.NODE_ENV,
    tokenSet: BOT_TOKEN !== 'YOUR_BOT_TOKEN_HERE' 
  });

  if (!isValid && process.env.NODE_ENV === 'production') {
    console.error('❌ Authentication failed in production');
    return res.status(401).json({ error: 'Invalid authentication' });
  }

  // Parse user info from initData
  try {
    if (!initData) throw new Error('No initData provided');
    
    const urlParams = new URLSearchParams(initData);
    const userJson = urlParams.get('user');
    const referralCode = urlParams.get('start_param');
    
    // EXTREME LOGGING FOR DIAGNOSTICS
    const allParams = Object.fromEntries(urlParams.entries());
    console.log('🔍 FULL TELEGRAM DATA RECEIVED:', allParams);
    console.log('📦 TARGET REFERRAL CODE:', referralCode);

    if (!userJson) throw new Error('No user data in initData');
    const tgUser = JSON.parse(userJson);
    
    // Sync with Database
    const [user, created] = await User.findOrCreate({
      where: { telegram_id: tgUser.id },
      defaults: {
        username: tgUser.username,
        first_name: tgUser.first_name,
        last_name: tgUser.last_name,
        balance: 0,
        referred_by: referralCode ? parseInt(referralCode) : null,
        photo_url: tgUser.photo_url
      }
    });

    // If new user joined via referral, we can add bonus here later
    if (created && referralCode) {
      console.log(`🎁 New referral: User ${tgUser.id} invited by ${referralCode}`);
    }

    // Back-fill referral if it's currently null
    if (!created && referralCode && !user.referred_by) {
      await user.update({ referred_by: parseInt(referralCode) });
      console.log(`🔄 Back-filled referral for User ${tgUser.id} from ${referralCode}`);
    }

    // Update username or photo if they changed
    if (!created && (user.username !== tgUser.username || user.photo_url !== tgUser.photo_url)) {
      await user.update({ 
        username: tgUser.username,
        photo_url: tgUser.photo_url 
      });
    }

    console.log(`${created ? '🆕 New user' : '✅ Returning user'} synced: ${user.first_name}`);

    return res.json({
      success: true,
      user: {
        id: user.telegram_id,
        username: user.username,
        firstName: user.first_name,
        balance: user.balance,
        pendingBalance: user.pending_balance,
        isPhoneVerified: user.is_phone_verified,
        isChannelJoined: user.is_channel_joined
      }
    });
  } catch (error) {
    console.error('Sync Error:', error);
    return res.status(400).json({ error: 'Failed to sync user data' });
  }
});

/**
 * POST /api/user/verify-onboarding
 * Checks if user joined channel and updates phone status
 */
app.post('/api/user/verify-onboarding', async (req, res) => {
  const { initData, phone_number } = req.body;
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHANNEL_ID = process.env.REQUIRED_CHANNEL_ID || '@rewardly_india';

  if (!validateTelegramInitData(initData, BOT_TOKEN) && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const urlParams = new URLSearchParams(initData);
    const tgUser = JSON.parse(urlParams.get('user'));
    
    const user = await User.findByPk(tgUser.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // 1. Update Phone if provided or check if already exists
    if (phone_number) {
      user.phone_number = phone_number;
      user.is_phone_verified = true;
    } else if (user.phone_number) {
      // If it's already in the DB from a previous interaction, mark as verified
      user.is_phone_verified = true;
    }

    // 2. Check Channel Membership via Telegram Bot API
    try {
      const response = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getChatMember`, {
        params: {
          chat_id: CHANNEL_ID,
          user_id: tgUser.id
        }
      });
      
      const status = response.data.result.status;
      // status can be: creator, administrator, member, restricted, left, kicked
      if (['creator', 'administrator', 'member', 'restricted'].includes(status)) {
        user.is_channel_joined = true;
      } else {
        user.is_channel_joined = false;
      }
    } catch (apiError) {
      console.error('Telegram API Error:', apiError.response?.data || apiError.message);
      // If channel ID is wrong or bot is not admin, we might need a fallback or keep false
    }
    
    await user.save();
    res.json({ 
      success: true, 
      isPhoneVerified: user.is_phone_verified,
      isChannelJoined: user.is_channel_joined,
      user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/user/update-ids
 * Update Google AID or iOS IDFA
 */
app.post('/api/user/update-ids', async (req, res) => {
  const { initData, google_aid, ios_idfa } = req.body;
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

  if (!validateTelegramInitData(initData, BOT_TOKEN) && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const urlParams = new URLSearchParams(initData);
    const tgUser = JSON.parse(urlParams.get('user'));
    
    const user = await User.findByPk(tgUser.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (google_aid !== undefined) user.google_aid = google_aid;
    if (ios_idfa !== undefined) user.ios_idfa = ios_idfa;
    
    await user.save();
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
