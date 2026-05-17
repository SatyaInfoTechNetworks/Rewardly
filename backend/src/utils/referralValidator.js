const User = require('../models/User');
const Referral = require('../models/Referral');
const Transaction = require('../models/Transaction');
const { trackContestActivity } = require('./contestTracker');
const { Op } = require('sequelize');

/**
 * Validates a referral based on user activity.
 * To be called whenever a user earns coins.
 * @param {string} userId - The referred user ID
 */
async function validateReferral(userId) {
  try {
    // 1. Check if user was referred and referral is not yet validated
    const referral = await Referral.findOne({
      where: {
        referred_user_id: userId,
        is_valid: false,
        status: { [Op.notIn]: ['fraud', 'rejected'] }
      }
    });

    if (!referral) return;

    // 2. Load User data
    const user = await User.findByPk(userId);
    if (!user) return;

    // 3. Validation Criteria
    
    // A. Account Age > 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if ((user.createdAt || user.created_at) > oneHourAgo) return;

    // B. Earned Coins >= 50
    // We should count only 'survey', 'offer', 'game', 'task' etc.
    const totalEarnings = await Transaction.sum('amount', {
      where: {
        telegram_id: userId,
        type: { [Op.in]: ['survey', 'offer', 'game', 'task', 'visit'] },
        status: 'completed'
      }
    }) || 0;

    if (totalEarnings < 50) return;

    // C. Completed at least 1 Activity (e.g., survey or game)
    const activityCount = await Transaction.count({
      where: {
        telegram_id: userId,
        type: { [Op.in]: ['survey', 'offer', 'game', 'task'] },
        status: 'completed'
      }
    });

    if (activityCount < 1) return;

    // 4. Mark as Validated
    await referral.update({
      is_valid: true,
      status: 'validated',
      validated_at: new Date()
    });

    // 5. Update Referrer's Contest Score
    console.log(`✅ Referral Validated: Referrer=${referral.referrer_user_id}, Referred=${userId}`);
    await trackContestActivity(referral.referrer_user_id, 'referrals', 1);

  } catch (err) {
    console.error('❌ Referral Validation Error:', err.message);
  }
}

module.exports = { validateReferral };
