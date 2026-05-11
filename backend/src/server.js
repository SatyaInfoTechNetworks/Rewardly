require('dotenv').config();
process.on('uncaughtException', (err) => {
  console.error('🔥 UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 UNHANDLED REJECTION:', reason);
});
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { PostHog } = require('posthog-node');
const { validateTelegramInitData } = require('./utils/telegramAuth');
const { sequelize, testConnection } = require('./config/database');
const User = require('./models/User');
const PayoutMethod = require('./models/PayoutMethod');
const PayoutTier = require('./models/PayoutTier');
const WithdrawalRequest = require('./models/WithdrawalRequest');
const Referral = require('./models/Referral');
const ReferralSetting = require('./models/ReferralSetting');
const ReferralMilestone = require('./models/ReferralMilestone');
const Contest = require('./models/Contest');
const ContestReward = require('./models/ContestReward');
const ContestEntry = require('./models/ContestEntry');
const AppSetting = require('./models/AppSetting');
const Game = require('./models/Game');
const GameSession = require('./models/GameSession');
const Transaction = require('./models/Transaction');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

// 0. PostHog Backend Analytics
const posthog = new PostHog(
  process.env.POSTHOG_PROJECT_TOKEN || 'phc_rvwkbVGsHbDYhS62fJLeGTVKfJG2zYRfuVbyrZyFyDtN',
  { host: process.env.POSTHOG_HOST || 'https://us.i.posthog.com' }
);

// Trust proxy for Dokploy/Nginx to get real IP
app.set('trust proxy', true);

// 1. SUPER PERMISSIVE CORS - MUST BE FIRST
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Reflect origin back to support credentials, or use * as fallback
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization, x-admin-secret, x-telegram-init-data');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());

// 2. Request Logger
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') return next();
  console.log(`${new Date().toISOString()} | ${req.method} ${req.url}`);
  next();
});

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

Referral.belongsTo(User, { as: 'referrer', foreignKey: 'referrer_user_id' });
Referral.belongsTo(User, { as: 'referred', foreignKey: 'referred_user_id' });

// Contest Associations
Contest.hasMany(ContestReward, { as: 'rewards', foreignKey: 'contest_id' });
ContestReward.belongsTo(Contest, { foreignKey: 'contest_id' });
Contest.hasMany(ContestEntry, { as: 'entries', foreignKey: 'contest_id' });
ContestEntry.belongsTo(Contest, { foreignKey: 'contest_id' });
ContestEntry.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(ContestEntry, { foreignKey: 'user_id' });

// Game Associations
Contest.belongsTo(Game, { foreignKey: 'game_id' });
Game.hasMany(Contest, { foreignKey: 'game_id' });
Game.hasMany(GameSession, { foreignKey: 'game_id' });
GameSession.belongsTo(Game, { foreignKey: 'game_id' });
GameSession.belongsTo(User, { foreignKey: 'user_id', targetKey: 'telegram_id' });
GameSession.belongsTo(Contest, { foreignKey: 'contest_id' });
User.hasMany(GameSession, { foreignKey: 'user_id', sourceKey: 'telegram_id' });

// Start Server (Move this inside sync)

// Test DB Connection & Sync Models
testConnection().then(() => {
  sequelize.sync({ alter: false }).then(async () => {
    console.log('✨ Database models synchronized.');
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✨ Server started on 0.0.0.0:${PORT}`);
    });
    
    // Manual Migration for Transactions table (since alter:false is set)
    try {
      // Standard MySQL syntax (catch will handle "column already exists" error)
      // Removing UNIQUE to avoid "Too many keys" limit
      await sequelize.query("ALTER TABLE `transactions` ADD `reference_id` VARCHAR(255) AFTER `telegram_id`;");
      console.log('✅ Transaction reference_id added (no index).');
    } catch (migErr) {
      if (migErr.parent?.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ Transaction reference_id already exists.');
      } else {
        console.log('Migration Note (reference_id):', migErr.message);
      }
    }

    try {
      await sequelize.query("ALTER TABLE `transactions` MODIFY `type` VARCHAR(255);");
      console.log('✅ Transaction type column modified.');
    } catch (migErr) {
      console.log('Migration Note (type):', migErr.message);
    }

    try {
      await sequelize.query("ALTER TABLE `app_settings` ADD `onboarding_verification_enabled` TINYINT(1) DEFAULT 1;");
      console.log('✅ AppSetting onboarding_verification_enabled added.');
    } catch (migErr) {
      if (migErr.parent?.code !== 'ER_DUP_FIELDNAME') console.log('Migration Note (onboarding):', migErr.message);
    }

    try {
      await sequelize.query("ALTER TABLE `app_settings` ADD `pubscale_app_id` VARCHAR(255) DEFAULT '26048184';");
      await sequelize.query("ALTER TABLE `app_settings` ADD `pubscale_enabled` TINYINT(1) DEFAULT 1;");
      await sequelize.query("ALTER TABLE `app_settings` ADD `opinion_universe_url` TEXT;");
      await sequelize.query("ALTER TABLE `app_settings` ADD `opinion_universe_enabled` TINYINT(1) DEFAULT 1;");
      console.log('✅ AppSetting PubScale & OpinionUniverse columns added.');
    } catch (migErr) {
      if (migErr.parent?.code !== 'ER_DUP_FIELDNAME') console.log('Migration Note (AdNetworks):', migErr.message);
    }
    
    // Auto-Seed Defaults
    try {
      // Seed Referral Settings
      const [refSettings] = await ReferralSetting.findOrCreate({ 
        where: { id: 1 }, 
        defaults: { 
          welcome_bonus: 50, 
          referral_reward: 300, 
          reward_trigger: 'redeem_approved',
          min_redeem_amount: 10,
          same_device_block: true
        } 
      });

      // Seed Referral Milestones
      await ReferralMilestone.findOrCreate({ where: { required_referrals: 10 }, defaults: { reward_coins: 1000, icon: 'Gift' } });
      await ReferralMilestone.findOrCreate({ where: { required_referrals: 50 }, defaults: { reward_coins: 7000, icon: 'Zap' } });
      await ReferralMilestone.findOrCreate({ where: { required_referrals: 100 }, defaults: { reward_coins: 15000, icon: 'Trophy' } });

      await User.findOrCreate({ where: { telegram_id: 111111 }, defaults: { first_name: 'Satya (Test)', balance: 5000, is_phone_verified: true } });
      await User.findOrCreate({ where: { telegram_id: 222222 }, defaults: { first_name: 'Rahul (Test)', balance: 2450, is_channel_joined: true } });
      
      // Auto-Seed Payout Methods
      const [upi] = await PayoutMethod.findOrCreate({ 
        where: { name: 'UPI' }, 
        defaults: { logo_url: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg', order_index: 1 } 
      });
      await PayoutTier.findOrCreate({ where: { payout_method_id: upi.id, coins_required: 5000 }, defaults: { amount_text: '₹50' } });
      await PayoutTier.findOrCreate({ where: { payout_method_id: upi.id, coins_required: 10000 }, defaults: { amount_text: '₹100' } });

      // Seed App Settings
      await AppSetting.findOrCreate({ 
        where: { id: 1 }, 
        defaults: { 
          game_reward_coins: 5, 
          game_limit_per_day: 20,
          adsgram_block_id: '29726',
          monetag_zone_id: '10977311',
          pubscale_app_id: '26048184',
          pubscale_enabled: true,
          opinion_universe_url: 'https://opinionuniverse.com/offerwall?pubId=1863',
          opinion_universe_enabled: true
        } 
      });

    } catch (e) {
      console.log('Seed skip:', e.message);
    }

    // --- CONTEST AUTOMATION ---
    const { processEndedContests } = require('./utils/contestManager');
    // Run every 10 minutes to check for ended contests
    setInterval(processEndedContests, 10 * 60 * 1000);
    // Also run once on startup
    processEndedContests();

  }).catch(err => {
    console.error('❌ Database Sync Error:', err);
  });
});

// Public Settings Route
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await AppSetting.findByPk(1);
    res.json(settings || { game_reward_coins: 5, game_limit_per_day: 20 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Routes
app.use('/api/surveys', require('./routes/surveys'));
app.use('/api/games', require('./routes/games'));
app.use('/api/postbacks', require('./routes/postbacks'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/payouts', require('./routes/payouts'));
app.use('/api/referrals', require('./routes/referrals'));
app.use('/api/contests', require('./routes/contests'));
app.use('/api/rewards', require('./routes/rewards'));
app.use('/api/game-system', require('./routes/gameSystem'));
app.use('/api/opinion-universe', require('./routes/opinionUniverse'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

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
    const clientIp = getClientIp(req);
    
    // Sync with Database
    const [user, created] = await User.findOrCreate({
      where: { telegram_id: tgUser.id },
      defaults: {
        username: tgUser.username,
        first_name: tgUser.first_name,
        last_name: tgUser.last_name,
        balance: 0,
        referred_by: referralCode ? parseInt(referralCode) : null,
        photo_url: tgUser.photo_url,
        ip_address: clientIp
      }
    });

    // Handle New Referral Logic
    if (created && referralCode) {
      const referrerId = parseInt(referralCode);
      const settings = await ReferralSetting.findByPk(1);

      // Fraud Check: Referrer cannot be self
      if (referrerId !== tgUser.id) {
        // Create Referral Record
        await Referral.create({
          referrer_id: referrerId,
          referred_user_id: tgUser.id,
          status: 'pending',
          ip_address: clientIp
        });

        // Award Welcome Bonus if configured
        if (settings && settings.welcome_bonus > 0) {
          await user.increment('balance', { by: settings.welcome_bonus });
          await Transaction.create({
            telegram_id: tgUser.id,
            amount: settings.welcome_bonus,
            type: 'bonus',
            description: 'Referral Welcome Bonus',
            status: 'completed'
          });
        }
      }
    }

    // Back-fill referral if it's currently null
    if (!created && referralCode && !user.referred_by && parseInt(referralCode) !== user.telegram_id) {
      await user.update({ referred_by: parseInt(referralCode) });
      
      // Also create a referral record if none exists
      await Referral.findOrCreate({
        where: { referred_user_id: user.telegram_id },
        defaults: {
          referrer_id: parseInt(referralCode),
          status: 'pending',
          ip_address: clientIp
        }
      });
    }

    // Update profile info
    await user.update({ 
      username: tgUser.username,
      photo_url: tgUser.photo_url,
      ip_address: clientIp
    });

    // Get App Settings
    const appSettings = await AppSetting.findByPk(1);

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
      },
      settings: {
        onboardingVerificationEnabled: appSettings?.onboarding_verification_enabled ?? true
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

    // 0. Check if verification is enabled globally
    const appSettings = await AppSetting.findByPk(1);
    if (appSettings && appSettings.onboarding_verification_enabled === false) {
      user.is_phone_verified = true;
      user.is_channel_joined = true;
      await user.save();
      return res.json({ 
        success: true, 
        isPhoneVerified: true,
        isChannelJoined: true,
        user
      });
    }

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

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Error]', err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});


