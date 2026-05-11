const Contest = require('../models/Contest');
const ContestEntry = require('../models/ContestEntry');
const ContestReward = require('../models/ContestReward');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

/**
 * Checks for ended contests and distributes rewards.
 */
async function processEndedContests() {
  const now = new Date();
  
  try {
    // 1. Find active contests that have passed their end_time
    const endedContests = await Contest.findAll({
      where: {
        status: 'active',
        end_time: { [Op.lte]: now }
      },
      include: [{ model: ContestReward, as: 'rewards' }]
    });

    for (const contest of endedContests) {
      console.log(`⌛ Ending Contest: ${contest.name} (ID: ${contest.id})`);
      
      const t = await sequelize.transaction();
      
      try {
        // 2. Finalize Rankings
        const entries = await ContestEntry.findAll({
          where: { contest_id: contest.id, status: 'active' },
          order: [['score', 'DESC']],
          transaction: t
        });

        // Update ranks in DB
        for (let i = 0; i < entries.length; i++) {
          await entries[i].update({ rank: i + 1 }, { transaction: t });
        }

        // 3. Calculate Prize Pool (if dynamic)
        let totalPool = contest.prize_pool;
        if (contest.prize_pool_type === 'dynamic') {
          const totalEntryFees = entries.length * (contest.entry_fee || 0);
          totalPool = Math.floor(totalEntryFees * (contest.prize_pool / 100));
          console.log(`💰 Dynamic Pool Calculated: ${totalPool} Coins (${entries.length} participants)`);
        }

        // 4. Distribute Rewards
        const rewards = contest.rewards;
        for (const reward of rewards) {
          // Find participants in this rank range
          const winners = entries.filter(e => e.rank >= reward.rank_from && e.rank <= reward.rank_to);
          
          for (const winner of winners) {
            const user = await User.findByPk(winner.user_id, { transaction: t });
            if (user) {
              // Calculate specific reward amount
              let rewardAmount = reward.reward_value;
              if (contest.prize_pool_type === 'dynamic') {
                // If dynamic, reward_value is a percentage of the totalPool
                rewardAmount = Math.floor(totalPool * (reward.reward_value / 100));
              }

              // Award reward
              if (reward.reward_type === 'coins' && rewardAmount > 0) {
                await user.increment('balance', { by: rewardAmount, transaction: t });
                
                // Record transaction
                await Transaction.create({
                  telegram_id: user.telegram_id,
                  amount: rewardAmount,
                  type: 'contest_reward',
                  description: `Contest Reward: ${contest.name} (Rank #${winner.rank})`,
                  status: 'completed',
                  contest_id: contest.id
                }, { transaction: t });
              }
              
              // Mark entry as winner
              await winner.update({ status: 'winner', reward_claimed: true }, { transaction: t });
            }
          }
        }

        // 4. Update Contest Status
        await contest.update({ status: 'completed' }, { transaction: t });

        await t.commit();
        console.log(`✅ Contest ${contest.name} completed and rewards distributed.`);
        
        // TODO: Notify winners via Telegram Bot if possible
        
      } catch (err) {
        await t.rollback();
        console.error(`❌ Error finalizing contest ${contest.id}:`, err.message);
      }
    }
  } catch (err) {
    console.error('❌ Contest Manager Error:', err.message);
  }
}

module.exports = { processEndedContests };
