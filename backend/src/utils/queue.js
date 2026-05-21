const { Queue, Worker } = require('bullmq');
const axios = require('axios');
const redisConnection = require('./redis');
const User = require('../models/User');
const Broadcast = require('../models/Broadcast');
const BroadcastLog = require('../models/BroadcastLog');
const Referral = require('../models/Referral');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_URL = process.env.API_URL || 'https://rewardlyapi.satyainfotechnetworks.com';

// 1. Initialize Queue
const broadcastQueue = new Queue('broadcastQueue', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000 // 5s base, then 20s, then 60s
    },
    removeOnComplete: true,
    removeOnFail: false
  }
});

// Helper for human-like randomized delay
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getRandomDelay = (type) => {
  switch (type) {
    case 'photo':
      return Math.floor(Math.random() * (250 - 100 + 1) + 100); // 100-250ms
    case 'video':
      return Math.floor(Math.random() * (500 - 250 + 1) + 250); // 250-500ms
    case 'animation':
      return Math.floor(Math.random() * (600 - 300 + 1) + 300); // 300-600ms
    default: // text
      return Math.floor(Math.random() * (70 - 40 + 1) + 40); // 40-70ms
  }
};

// 2. Initialize Worker
const worker = new Worker('broadcastQueue', async (job) => {
  const { broadcastId, telegramId, userId } = job.data;
  
  // Fetch user and broadcast details
  const user = await User.findByPk(userId);
  const broadcast = await Broadcast.findByPk(broadcastId);
  
  if (!user || !broadcast) {
    console.error(`❌ Job Failed: User ${userId} or Broadcast ${broadcastId} not found.`);
    return;
  }

  if (user.is_banned) {
    console.log(`🚫 User ${user.first_name} (${telegramId}) is banned. Skipping.`);
    return;
  }

  // Create Broadcast Log if not exists
  let log = await BroadcastLog.findOne({
    where: { broadcast_id: broadcastId, user_id: userId }
  });
  
  if (!log) {
    log = await BroadcastLog.create({
      broadcast_id: broadcastId,
      user_id: userId,
      telegram_id: telegramId,
      status: 'pending'
    });
  }

  // Replace Template Variables
  let formattedMessage = broadcast.message;
  
  // Calculate referrals count
  const referralsCount = await Referral.count({
    where: { referrer_user_id: user.telegram_id, status: 'validated' }
  });

  const variables = {
    '{first_name}': user.first_name || 'User',
    '{username}': user.username ? `@${user.username}` : (user.first_name || 'User'),
    '{coins}': user.balance || 0,
    '{referrals}': referralsCount,
    '{wallet}': `₹${((user.balance || 0) / 100).toFixed(2)}`
  };

  for (const [placeholder, value] of Object.entries(variables)) {
    formattedMessage = formattedMessage.replace(new RegExp(placeholder, 'g'), value);
  }

  // Use direct target URL for the inline button so Telegram displays a clean, trusted link
  let reply_markup = undefined;
  if (broadcast.button_text && broadcast.button_url) {
    reply_markup = {
      inline_keyboard: [
        [
          {
            text: broadcast.button_text,
            url: broadcast.button_url
          }
        ]
      ]
    };
  }

  // Apply Randomized Human-like Delay before calling Telegram API
  const delayMs = getRandomDelay(broadcast.media_type);
  await sleep(delayMs);

  // Send Telegram API request
  let method = 'sendMessage';
  let payload = {
    chat_id: telegramId,
    parse_mode: 'HTML',
    reply_markup
  };

  if (broadcast.media_type === 'photo') {
    method = 'sendPhoto';
    payload.photo = broadcast.media_url;
    payload.caption = formattedMessage;
  } else if (broadcast.media_type === 'video') {
    method = 'sendVideo';
    payload.video = broadcast.media_url;
    payload.caption = formattedMessage;
  } else if (broadcast.media_type === 'animation') {
    method = 'sendAnimation';
    payload.animation = broadcast.media_url;
    payload.caption = formattedMessage;
  } else {
    payload.text = formattedMessage;
  }

  try {
    const response = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, payload);
    
    if (response.data.ok) {
      log.status = 'success';
      log.sent_at = new Date();
      await log.save();

      // Update User fields
      await user.update({
        last_notification_at: new Date()
      });
      
      console.log(`✅ Broadcast sent to ${user.first_name} (${telegramId}) [Delay: ${delayMs}ms]`);
    } else {
      throw new Error(`Telegram API error: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    // 3. Rate Limit / 429 Handling
    if (error.response && error.response.status === 429) {
      const retryAfter = error.response.data?.parameters?.retry_after || 5;
      console.warn(`⚠️ Telegram Rate Limit hit! Pausing queue worker for ${retryAfter}s...`);
      
      // Pause worker and schedule resume
      await worker.pause();
      setTimeout(async () => {
        console.log('🔄 Resuming queue worker after Telegram backoff period...');
        await worker.resume();
      }, retryAfter * 1000);

      // Save rate limit details and fail job for retry
      log.status = 'failed';
      log.error_message = `Rate Limit: Retry after ${retryAfter}s`;
      await log.save();
      
      throw new Error(`Telegram Rate Limit: Retry after ${retryAfter}s`);
    }

    // Bot Blocked check
    const isBlocked = error.response?.data?.description?.includes('bot was blocked by the user') ||
                      error.message?.includes('bot was blocked by the user') ||
                      error.response?.data?.description?.includes('user is deactivated');
    
    if (isBlocked) {
      log.status = 'blocked';
      log.error_message = error.response?.data?.description || error.message;
      await log.save();

      // Mark user status as blocked
      await user.update({
        status: 'blocked'
      });
      console.log(`🚫 Bot blocked by user ${user.first_name} (${telegramId}). Updated user status.`);
      return;
    }

    // Other general failures
    log.status = 'failed';
    log.error_message = error.response?.data?.description || error.message;
    await log.save();

    console.error(`❌ Failed to send broadcast to user ${user.first_name} (${telegramId}):`, error.response?.data || error.message);
    throw error;
  }
}, {
  connection: redisConnection,
  concurrency: 1 // Single concurrency to guarantee rate limit ordering and randomized spacing
});

worker.on('failed', (job, err) => {
  console.error(`🔥 Queue Job ${job.id} failed after attempts:`, err.message);
});

module.exports = {
  broadcastQueue,
  worker
};
