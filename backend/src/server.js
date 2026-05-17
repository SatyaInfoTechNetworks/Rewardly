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
const LuckyDraw = require('./models/LuckyDraw');
const LuckyDrawEntry = require('./models/LuckyDrawEntry');
const LuckyDrawWinner = require('./models/LuckyDrawWinner');
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

// Lucky Draw Associations
LuckyDraw.hasMany(LuckyDrawEntry, { as: 'entries', foreignKey: 'lucky_draw_id' });
LuckyDrawEntry.belongsTo(LuckyDraw, { foreignKey: 'lucky_draw_id' });
LuckyDrawEntry.belongsTo(User, { foreignKey: 'user_id', targetKey: 'telegram_id' });
User.hasMany(LuckyDrawEntry, { foreignKey: 'user_id', sourceKey: 'telegram_id' });

LuckyDraw.hasMany(LuckyDrawWinner, { as: 'winners', foreignKey: 'lucky_draw_id' });
LuckyDrawWinner.belongsTo(LuckyDraw, { foreignKey: 'lucky_draw_id' });
LuckyDrawWinner.belongsTo(User, { foreignKey: 'user_id', targetKey: 'telegram_id' });
User.hasMany(LuckyDrawWinner, { foreignKey: 'user_id', sourceKey: 'telegram_id' });

// Start Server (Move this inside sync)

// Test DB Connection & Sync Models
testConnection().then(async () => {
  // --- MASTER DATABASE MIGRATION SYSTEM ---
  const migrations = [
    // 1. Users Table
    "ALTER TABLE `users` ADD `google_aid` VARCHAR(255);",
    "ALTER TABLE `users` ADD `ios_idfa` VARCHAR(255);",
    "ALTER TABLE `users` ADD `phone_number` VARCHAR(255);",
    "ALTER TABLE `users` ADD `is_phone_verified` TINYINT(1) DEFAULT 0;",
    "ALTER TABLE `users` ADD `is_channel_joined` TINYINT(1) DEFAULT 0;",
    "ALTER TABLE `users` ADD `daily_games_played` INTEGER DEFAULT 0;",
    "ALTER TABLE `users` ADD `last_game_date` DATE;",
    
    // 2. Transactions Table
    "ALTER TABLE `transactions` ADD `reference_id` VARCHAR(255);",
    "ALTER TABLE `transactions` ADD `external_id` VARCHAR(255);",
    "ALTER TABLE `transactions` ADD `contest_id` INTEGER;",
    "ALTER TABLE `transactions` MODIFY `type` VARCHAR(255);",

    // 3. Contests Table
    "ALTER TABLE `contests` ADD `name` VARCHAR(255);",
    "ALTER TABLE `contests` ADD `slug` VARCHAR(255);",
    "ALTER TABLE `contests` ADD `tracking_type` ENUM('earnings', 'referrals', 'game_score') DEFAULT 'earnings';",
    "ALTER TABLE `contests` ADD `game_id` INTEGER;",
    "ALTER TABLE `contests` ADD `banner_image` VARCHAR(255);",
    "ALTER TABLE `contests` ADD `status` ENUM('draft', 'scheduled', 'active', 'completed', 'cancelled') DEFAULT 'draft';",
    "ALTER TABLE `contests` ADD `start_time` DATETIME;",
    "ALTER TABLE `contests` ADD `end_time` DATETIME;",
    "ALTER TABLE `contests` ADD `prize_pool` INTEGER DEFAULT 0;",
    "ALTER TABLE `contests` ADD `prize_pool_type` ENUM('fixed', 'dynamic') DEFAULT 'fixed';",
    "ALTER TABLE `contests` ADD `access_type` ENUM('free', 'paid', 'invite_only') DEFAULT 'free';",
    "ALTER TABLE `contests` ADD `entry_fee` INTEGER DEFAULT 0;",
    "ALTER TABLE `contests` ADD `entry_fee_type` ENUM('coins', 'cash') DEFAULT 'coins';",
    "ALTER TABLE `contests` ADD `maximum_participants` INTEGER;",
    "ALTER TABLE `contests` ADD `description` TEXT;",
    "ALTER TABLE `contests` ADD `rules` TEXT;",
    "ALTER TABLE `contests` ADD `auto_join` TINYINT(1) DEFAULT 1;",
    "ALTER TABLE `contests` ADD `minimum_activity` INTEGER DEFAULT 0;",

    // 4. App Settings Table
    "ALTER TABLE `app_settings` ADD `onboarding_verification_enabled` TINYINT(1) DEFAULT 1;",
    "ALTER TABLE `app_settings` ADD `pubscale_app_id` VARCHAR(255) DEFAULT '78594689';",
    "ALTER TABLE `app_settings` ADD `pubscale_enabled` TINYINT(1) DEFAULT 1;",
    "ALTER TABLE `app_settings` ADD `opinion_universe_url` TEXT;",
    "ALTER TABLE `app_settings` ADD `opinion_universe_enabled` TINYINT(1) DEFAULT 1;",
    "ALTER TABLE `app_settings` ADD `pubscale_sandbox` TINYINT(1) DEFAULT 0;",
    "ALTER TABLE `app_settings` ADD `adsgram_checkin_block_id` VARCHAR(255) DEFAULT '4376';"
  ];

  for (const sql of migrations) {
    try {
      await sequelize.query(sql);
    } catch (err) {
      const isDuplicate = err.parent?.code === 'ER_DUP_FIELDNAME' || 
                         err.message.includes('Duplicate column name');
      if (!isDuplicate) console.log(`ℹ️ Migration Note: ${err.message}`);
    }
  }

  sequelize.sync({ alter: false }).then(async () => {
    console.log('✨ Database models synchronized.');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✨ Server started on 0.0.0.0:${PORT}`);
    });

    // 5. Ensure existing settings have defaults (one-time fix for existing rows)
    try {
      await sequelize.query("UPDATE `app_settings` SET `pubscale_enabled` = 1 WHERE `pubscale_enabled` IS NULL;");
      await sequelize.query("UPDATE `app_settings` SET `opinion_universe_enabled` = 1 WHERE `opinion_universe_enabled` IS NULL;");
      await sequelize.query("UPDATE `app_settings` SET `pubscale_app_id` = '78594689' WHERE `pubscale_app_id` IS NULL OR `pubscale_app_id` = '26048184';");
      await sequelize.query("UPDATE `app_settings` SET `opinion_universe_url` = 'https://opinionuniverse.com/offerwall?pubId=1863&app_id=ID_eb1f5bea3e8caadcfcf6ccb5d35a1d1d' WHERE `opinion_universe_url` NOT LIKE '%app_id=ID_eb1f5bea3e8caadcfcf6ccb5d35a1d1d%';");
      await sequelize.query("UPDATE `app_settings` SET `adsgram_checkin_block_id` = '30393' WHERE `adsgram_checkin_block_id` IS NULL OR `adsgram_checkin_block_id` = '4376'");
    } catch (err) {
      console.log('ℹ️ Migration Note (Defaults):', err.message);
    }
    console.log('✅ Database Schema Check Complete.');

    // Auto-Seed Defaults
    try {
      // 1. App Settings
      await AppSetting.findOrCreate({
        where: { id: 1 },
        defaults: {
          game_reward_coins: 5,
          game_limit_per_day: 20,
          adsgram_block_id: '4376',
          monetag_zone_id: '10977311',
          adsgram_enabled: true,
          monetag_enabled: true,
          onboarding_verification_enabled: true,
          pubscale_app_id: '78594689',
          pubscale_enabled: true,
          opinion_universe_url: 'https://opinionuniverse.com/offerwall?pubId=1863&app_id=ID_eb1f5bea3e8caadcfcf6ccb5d35a1d1d',
          opinion_universe_enabled: true,
          pubscale_sandbox: false
        }
      });
 
      // 2. Referral Settings
      await ReferralSetting.findOrCreate({ 
        where: { id: 1 }, 
        defaults: { 
          welcome_bonus: 50, 
          referral_reward: 300, 
          reward_trigger: 'redeem_approved',
          min_redeem_amount: 10,
          same_device_block: true
        } 
      });

      // 3. Referral Milestones
      await ReferralMilestone.findOrCreate({ where: { required_referrals: 10 }, defaults: { reward_coins: 1000, icon: 'Gift' } });
      await ReferralMilestone.findOrCreate({ where: { required_referrals: 50 }, defaults: { reward_coins: 7000, icon: 'Zap' } });
      await ReferralMilestone.findOrCreate({ where: { required_referrals: 100 }, defaults: { reward_coins: 15000, icon: 'Trophy' } });

      // 4. Payout Methods
      const [upi] = await PayoutMethod.findOrCreate({ 
        where: { name: 'UPI' }, 
        defaults: { logo_url: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg', order_index: 1 } 
      });
      await PayoutTier.findOrCreate({ where: { payout_method_id: upi.id, coins_required: 5000 }, defaults: { amount_text: '₹50' } });
      await PayoutTier.findOrCreate({ where: { payout_method_id: upi.id, coins_required: 10000 }, defaults: { amount_text: '₹100' } });

      // 5. Seeds for Lucky Draws / Jackpot
      const now = new Date();
      const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      await LuckyDraw.findOrCreate({
        where: { slug: 'daily-free-draw' },
        defaults: {
          title: '💰 Daily Free Draw',
          description: 'Claim your daily ticket, then watch up to 5 rewarded ads to get more entries! Build your chance daily.',
          banner_image: 'https://images.unsplash.com/photo-1595853035070-59a39fe84de3?auto=format&fit=crop&q=80&w=600',
          type: 'daily_free',
          prize_type: 'cash',
          prize_amount: '₹50 Paytm Cash',
          prize_value: 50,
          status: 'active',
          start_time: now,
          end_time: oneDayLater,
          free_entries_allowed: true,
          ad_entries_enabled: true,
          max_ad_entries: 5,
          max_entries_per_user: 6,
          winners_count: 1
        }
      });

      await LuckyDraw.findOrCreate({
        where: { slug: 'weekly-mega-jackpot' },
        defaults: {
          title: '🏆 Weekly Mega Jackpot',
          description: 'Our ultimate draw event! Buy tickets using coins or unlock slots by playing ads to maximize entry chance.',
          banner_image: 'https://images.unsplash.com/photo-1518173946687-a4c8a383392c?auto=format&fit=crop&q=80&w=600',
          type: 'weekly_mega',
          prize_type: 'cash',
          prize_amount: '₹1000 Paytm + 50,000 Coins',
          prize_value: 1000,
          status: 'active',
          start_time: now,
          end_time: sevenDaysLater,
          free_entries_allowed: true,
          ad_entries_enabled: true,
          max_ad_entries: 20,
          coin_entry_enabled: true,
          coin_cost_per_entry: 500,
          max_entries_per_user: 25,
          winners_count: 3
        }
      });

      await LuckyDraw.findOrCreate({
        where: { slug: 'bronze-coin-pot' },
        defaults: {
          title: '🥉 Bronze Coin Pot',
          description: 'Spend coins to qualify for the pool! Standard random sweepstakes selection with direct coin payouts.',
          banner_image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&q=80&w=600',
          type: 'coin_jackpot',
          prize_type: 'coins',
          prize_amount: '10,000 Coins',
          prize_value: 10000,
          status: 'active',
          start_time: now,
          end_time: threeDaysLater,
          free_entries_allowed: false,
          ad_entries_enabled: false,
          coin_entry_enabled: true,
          coin_cost_per_entry: 100,
          max_entries_per_user: 10,
          winners_count: 1
        }
      });

      console.log('✅ Default settings and seeds initialized.');
    } catch (e) {
      console.log('ℹ️ Seed/Init Note:', e.message);
    }

    // --- CONTEST AUTOMATION ---
    const { processEndedContests } = require('./utils/contestManager');
    // Run every 10 minutes to check for ended contests
    setInterval(processEndedContests, 10 * 60 * 1000);
    // Also run once on startup
    processEndedContests();

    // --- LUCKY DRAW AUTOMATION ---
    const { processEndedDraws } = require('./utils/luckyDrawManager');
    // Run every 5 minutes to resolve draws and declare winners
    setInterval(processEndedDraws, 5 * 60 * 1000);
    // Also run once on startup
    processEndedDraws();

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
app.use('/api/admin', require('./routes/adminContests'));
app.use('/api/admin', require('./routes/adminLuckyDraws'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/payouts', require('./routes/payouts'));
app.use('/api/referrals', require('./routes/referrals'));
  app.use('/api/contests', require('./routes/contests'));
app.use('/api/rewards', require('./routes/rewards'));
app.use('/api/game-system', require('./routes/gameSystem'));
app.use('/api/opinion-universe', require('./routes/opinionUniverse'));
app.use('/api/lucky-draws', require('./routes/luckyDraws'));

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
          referrer_user_id: referrerId,
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
          referrer_user_id: parseInt(referralCode),
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
        isChannelJoined: user.is_channel_joined,
        google_aid: user.google_aid,
        ios_idfa: user.ios_idfa
      },
      settings: appSettings || {
        onboarding_verification_enabled: true,
        pubscale_enabled: true,
        opinion_universe_enabled: true
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

/**
 * GET /api/user/transactions
 * Fetch user transaction history
 */
app.get('/api/user/transactions', async (req, res) => {
  const initData = req.headers['x-telegram-init-data'];
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

  if (!validateTelegramInitData(initData, BOT_TOKEN) && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const urlParams = new URLSearchParams(initData);
    const tgUser = JSON.parse(urlParams.get('user'));
    
    const transactions = await Transaction.findAll({
      where: { telegram_id: tgUser.id },
      order: [['created_at', 'DESC']],
      limit: 50
    });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Error]', err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});


