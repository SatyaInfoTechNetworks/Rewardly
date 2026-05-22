const cron = require('node-cron');
const { Op } = require('sequelize');
const { broadcastQueue } = require('./queue');
const User = require('../models/User');
const Broadcast = require('../models/Broadcast');
const BroadcastLog = require('../models/BroadcastLog');
const Referral = require('../models/Referral');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const AppSetting = require('../models/AppSetting');

// Helper to get target users based on segmentation
const getTargetUsers = async (targetType) => {
  let where = { is_banned: false, status: { [Op.ne]: 'blocked' } };
  
  switch (targetType) {
    case 'active_users':
      // Active within 24h
      where.last_active_at = {
        [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
      };
      break;
    case 'inactive_users':
      // Inactive for 3 days or more
      where.last_active_at = {
        [Op.or]: [
          { [Op.lt]: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
          { [Op.is]: null }
        ]
      };
      break;
    case 'vip_users':
      // High earners: balance >= 5000 coins
      where.balance = { [Op.gte]: 5000 };
      break;
    case 'new_users':
      // Recently joined within 24h
      where.created_at = {
        [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
      };
      break;
    case 'referral_users':
      // Has been referred by someone
      where.referred_by = { [Op.ne]: null };
      break;
    case 'wallet_users':
      // Wallet balance > 1000 coins (rupees > 10)
      where.balance = { [Op.gte]: 1000 };
      break;
    case 'all_users':
    default:
      // All active users
      break;
  }
  
  return await User.findAll({ where });
};

// Queue a broadcast campaign
const queueCampaign = async (broadcast) => {
  try {
    console.log(`📡 Queuing broadcast campaign #${broadcast.id}: "${broadcast.title}"...`);
    await broadcast.update({ status: 'running' });

    const users = await getTargetUsers(broadcast.target_type);
    console.log(`👥 Found ${users.length} target users for broadcast #${broadcast.id}.`);

    if (users.length === 0) {
      await broadcast.update({ status: 'completed' });
      return;
    }

    // Push job for each user to queue
    const jobs = users.map(user => ({
      name: `sendMsg_${broadcast.id}_${user.telegram_id}`,
      data: {
        broadcastId: broadcast.id,
        telegramId: user.telegram_id,
        userId: user.telegram_id
      }
    }));

    await broadcastQueue.addBulk(jobs);
    await broadcast.update({ status: 'completed' });
    console.log(`✅ Queued all ${users.length} jobs for broadcast #${broadcast.id}.`);
  } catch (error) {
    console.error(`❌ Error queuing campaign #${broadcast.id}:`, error);
    await broadcast.update({ status: 'failed' });
  }
};

// --- CRON JOBS ---

// 1. Every minute: Check for scheduled campaigns
const startCampaignScheduler = () => {
  cron.schedule('* * * * *', async () => {
    console.log('🕒 Scheduler: Checking for due scheduled campaigns...');
    try {
      const dueCampaigns = await Broadcast.findAll({
        where: {
          status: 'scheduled',
          scheduled_at: {
            [Op.lte]: new Date()
          }
        }
      });

      for (const campaign of dueCampaigns) {
        await queueCampaign(campaign);
      }
    } catch (error) {
      console.error('❌ Scheduler campaign check failed:', error);
    }
  });
};

// 2. Daily 9:00 AM IST automations (Peak Indian timing)
// IST is UTC+5:30. So 9:00 AM IST is 3:30 AM UTC
const startAutomationScheduler = () => {
  cron.schedule('30 3 * * *', async () => {
    console.log('🧠 Scheduler: Running Smart Marketing Automations (9:00 AM IST)...');
    try {
      const today = new Date();

      // Fetch AppSettings to respect automation toggle state
      const settings = await AppSetting.findByPk(1);

      // Ensure system templates exist or findOrCreate
      const [inactiveCampaign] = await Broadcast.findOrCreate({
        where: { title: 'System Automation: Inactive Reminder' },
        defaults: {
          message: '😢 We miss you!\n\nCome back and claim bonus rewards 🎁',
          target_type: 'automation',
          status: 'running'
        }
      });

      const [walletCampaign] = await Broadcast.findOrCreate({
        where: { title: 'System Automation: Wallet Reminder' },
        defaults: {
          message: '💸 Your balance is ready for withdrawal!',
          target_type: 'automation',
          status: 'running'
        }
      });

      const [referralCampaign] = await Broadcast.findOrCreate({
        where: { title: 'System Automation: Referral Push' },
        defaults: {
          message: '🔥 Invite friends and earn bonus rewards!',
          target_type: 'automation',
          status: 'running'
        }
      });

      const allUsers = await User.findAll({ where: { is_banned: false, status: { [Op.ne]: 'blocked' } } });

      for (const user of allUsers) {
        // Prevent notification flooding (limit to 1 system notification per 24 hours)
        if (user.last_notification_at) {
          const hoursSinceNotified = (today - new Date(user.last_notification_at)) / (1000 * 60 * 60);
          if (hoursSinceNotified < 24) continue;
        }

        // --- AUTOMATION 1: Inactive Users (>3 days) ---
        if (!settings || settings.inactive_reminder_enabled !== false) {
          let lastActive = user.last_active_at ? new Date(user.last_active_at) : user.created_at;
          const daysInactive = (today - new Date(lastActive)) / (1000 * 60 * 60 * 24);
          if (daysInactive >= 3) {
            // Check if already notified within 7 days for this automation to avoid spamming
            const alreadyLogged = await BroadcastLog.findOne({
              where: {
                broadcast_id: inactiveCampaign.id,
                user_id: user.telegram_id,
                created_at: { [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
              }
            });

            if (!alreadyLogged) {
              await broadcastQueue.add(`inactive_${user.telegram_id}`, {
                broadcastId: inactiveCampaign.id,
                telegramId: user.telegram_id,
                userId: user.telegram_id
              });
              continue; // Skip other automations for today to keep it targeted
            }
          }
        }

        // --- AUTOMATION 2: Wallet Withdrawal Reminder ---
        // Minimum tier limit is usually around 5000 coins (Rs 50)
        if (!settings || settings.wallet_reminder_enabled !== false) {
          if (user.balance >= 5000) {
            const alreadyLogged = await BroadcastLog.findOne({
              where: {
                broadcast_id: walletCampaign.id,
                user_id: user.telegram_id,
                created_at: { [Op.gte]: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } // Once every 2 weeks
              }
            });

            if (!alreadyLogged) {
              await broadcastQueue.add(`wallet_${user.telegram_id}`, {
                broadcastId: walletCampaign.id,
                telegramId: user.telegram_id,
                userId: user.telegram_id
              });
              continue;
            }
          }
        }

        // --- AUTOMATION 3: Referral Push (Users with 0 referrals after 2 days)
        if (!settings || settings.referral_push_enabled !== false) {
          const daysJoined = (today - new Date(user.created_at)) / (1000 * 60 * 60 * 24);
          if (daysJoined >= 2) {
            const refCount = await Referral.count({ where: { referrer_user_id: user.telegram_id } });
            if (refCount === 0) {
              const alreadyLogged = await BroadcastLog.findOne({
                where: {
                  broadcast_id: referralCampaign.id,
                  user_id: user.telegram_id
                }
              });

              if (!alreadyLogged) {
                await broadcastQueue.add(`referral_push_${user.telegram_id}`, {
                  broadcastId: referralCampaign.id,
                  telegramId: user.telegram_id,
                  userId: user.telegram_id
                });
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Automation scheduler run failed:', error);
    }
  });
};

// 3. Midnight User Quality Score compiler (12:00 AM IST -> 6:30 PM UTC)
const startQualityScoreScheduler = () => {
  cron.schedule('30 18 * * *', async () => {
    console.log('🕒 Scheduler: Recalculating User Quality Scores (12:00 AM IST)...');
    try {
      const users = await User.findAll({ where: { is_banned: false } });
      const today = new Date();

      for (const user of users) {
        let score = 20; // Base score

        // 1. Activity Time check
        let lastActive = user.last_active_at ? new Date(user.last_active_at) : user.created_at;
        const hoursInactive = (today - new Date(lastActive)) / (1000 * 60 * 60);
        if (hoursInactive <= 24) {
          score += 30; // Active within last 24h
        } else if (hoursInactive <= 72) {
          score += 15; // Active within 3 days
        }

        // 2. Verified Referrals count (+10 points per validated referral, max 40)
        const referralCount = await Referral.count({
          where: { referrer_user_id: user.telegram_id, status: 'validated' }
        });
        score += Math.min(40, referralCount * 10);

        // 3. Notification click rates (+5 points per click, max 15)
        const clicks = user.notification_clicks || 0;
        score += Math.min(15, clicks * 5);

        // 4. Withdrawal completion status
        const withdrawalsCount = await WithdrawalRequest.count({
          where: { user_id: user.telegram_id, status: 'approved' }
        });
        if (withdrawalsCount > 0) {
          score += 15; // Trusted user with validated payout history
        }

        const finalScore = Math.min(100, score);
        await user.update({ quality_score: finalScore });
      }
      console.log('✅ User Quality Score compiler completed successfully.');
    } catch (error) {
      console.error('❌ User Quality Score scheduler calculation failed:', error);
    }
  });
};

const initializeSchedulers = () => {
  startCampaignScheduler();
  startAutomationScheduler();
  startQualityScoreScheduler();
  console.log('✨ All node-cron schedulers successfully initialized.');
};

module.exports = {
  initializeSchedulers,
  queueCampaign
};
