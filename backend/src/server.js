require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { validateTelegramInitData } = require('./utils/telegramAuth');
const { sequelize, testConnection } = require('./config/database');
const User = require('./models/User');

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
app.use(cors());
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
        balance: user.balance
      }
    });
  } catch (error) {
    console.error('Sync Error:', error);
    return res.status(400).json({ error: 'Failed to sync user data' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
