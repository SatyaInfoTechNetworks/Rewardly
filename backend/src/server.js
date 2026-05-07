require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { validateTelegramInitData } = require('./utils/telegramAuth');
const { sequelize, testConnection } = require('./config/database');
const User = require('./models/User');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for Dokploy/Nginx to get real IP
app.set('trust proxy', true);

// Utility to get real IP
const getClientIp = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
};

// Test DB Connection & Sync Models
testConnection().then(() => {
  sequelize.sync({ alter: true }).then(() => {
    console.log('✨ Database models synchronized.');
  });
});

// Middleware
app.use(cors({
  origin: ['https://rewardly.satyainfotechnetworks.com', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(bodyParser.json());

// Routes
app.use('/api/surveys', require('./routes/surveys'));
app.use('/api/postbacks', require('./routes/postbacks'));
app.use('/api/admin', require('./routes/admin'));

app.get('/', (req, res) => {
  res.json({ message: 'Rewardly Backend API is running' });
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
    if (!userJson) throw new Error('No user data in initData');
    
    const tgUser = JSON.parse(userJson);
    
    // Sync with Database
    const [user, created] = await User.findOrCreate({
      where: { telegram_id: tgUser.id },
      defaults: {
        username: tgUser.username,
        first_name: tgUser.first_name,
        last_name: tgUser.last_name,
        balance: 0 // Starting balance
      }
    });

    // Update username if it changed
    if (!created && user.username !== tgUser.username) {
      await user.update({ username: tgUser.username });
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
