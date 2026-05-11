const Contest = require('../models/Contest');
const ContestEntry = require('../models/ContestEntry');
const { Op } = require('sequelize');

/**
 * Tracks activity and updates active contest scores
 * @param {string} userId - Telegram ID of the user
 * @param {string} type - 'earning', 'referral', or 'streak'
 * @param {number} amount - Amount to add to score (coins, count, etc)
 */
async function trackContestActivity(userId, trackingType, amount = 1) {
  try {
    const now = new Date();
    
    // Find all active contests of this type
    const activeContests = await Contest.findAll({
      where: {
        tracking_type: trackingType,
        status: 'active',
        start_time: { [Op.lte]: now },
        end_time: { [Op.gte]: now }
      }
    });

    for (const contest of activeContests) {
      // Respect auto_join setting
      let entry = await ContestEntry.findOne({
        where: { contest_id: contest.id, user_id: userId }
      });

      if (!entry) {
        if (contest.auto_join) {
          entry = await ContestEntry.create({
            contest_id: contest.id,
            user_id: userId,
            score: 0,
            status: 'active'
          });
        } else {
          // User must manually join this contest (future feature)
          continue;
        }
      }

      // Update Score
      await entry.increment('score', { by: amount });
      console.log(`🏆 Contest [${contest.name}] - User ${userId} score updated: +${amount} (${trackingType})`);
    }
  } catch (err) {
    console.error('❌ Contest Tracking Error:', err.message);
  }
}

module.exports = { trackContestActivity };
