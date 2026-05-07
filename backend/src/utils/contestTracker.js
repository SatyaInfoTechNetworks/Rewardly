const Contest = require('../models/Contest');
const ContestEntry = require('../models/ContestEntry');
const { Op } = require('sequelize');

/**
 * Tracks activity and updates active contest scores
 * @param {string} userId - Telegram ID of the user
 * @param {string} type - 'earning', 'referral', or 'streak'
 * @param {number} amount - Amount to add to score (coins, count, etc)
 */
async function trackContestActivity(userId, type, amount = 1) {
  try {
    const now = new Date();
    
    // Find all active contests of this type
    const activeContests = await Contest.findAll({
      where: {
        type,
        status: 'active',
        start_time: { [Op.lte]: now },
        end_time: { [Op.gte]: now }
      }
    });

    for (const contest of activeContests) {
      // Find or Create Entry
      const [entry, created] = await ContestEntry.findOrCreate({
        where: { contest_id: contest.id, user_id: userId },
        defaults: { score: 0 }
      });

      // Update Score
      await entry.increment('score', { by: amount });
      console.log(`🏆 Contest [${contest.name}] - User ${userId} score updated: +${amount}`);
    }
  } catch (err) {
    console.error('❌ Contest Tracking Error:', err.message);
  }
}

module.exports = { trackContestActivity };
