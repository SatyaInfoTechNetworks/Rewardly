const LuckyDraw = require('../models/LuckyDraw');
const LuckyDrawEntry = require('../models/LuckyDrawEntry');
const LuckyDrawWinner = require('../models/LuckyDrawWinner');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { sequelize } = require('../config/database');

/**
 * Automates ending expired lucky draws and selecting weighted random winners
 */
async function processEndedDraws() {
  try {
    const endedActiveDraws = await LuckyDraw.findAll({
      where: {
        status: 'active',
        end_time: { [require('sequelize').Op.lte]: new Date() }
      }
    });

    if (endedActiveDraws.length === 0) return;
    console.log(`🎰 Found ${endedActiveDraws.length} expired lucky draws. Processing winners...`);

    for (const draw of endedActiveDraws) {
      const transaction = await sequelize.transaction();
      try {
        // 1. Fetch all entries for this draw
        const entries = await LuckyDrawEntry.findAll({
          where: { lucky_draw_id: draw.id }
        });

        if (entries.length === 0) {
          console.log(`ℹ️ Draw "${draw.title}" (ID: ${draw.id}) ended with 0 participants.`);
          await draw.update({ status: 'ended' }, { transaction });
          await transaction.commit();
          continue;
        }

        // 2. Weighted Random Selection
        // Since each entry represents 1 ticket, selecting a random entry naturally weights users with more entries
        const winnerEntriesSelected = [];
        const winnersCountToSelect = Math.min(draw.winners_count || 1, entries.length);

        // Copy list to avoid selecting same entry twice (though users can have multiple entries, we want unique winners per draw)
        let remainingEntries = [...entries];
        const selectedUserIds = new Set();

        for (let i = 0; i < winnersCountToSelect; i++) {
          if (remainingEntries.length === 0) break;
          
          const randomIndex = Math.floor(Math.random() * remainingEntries.length);
          const chosenEntry = remainingEntries[randomIndex];
          
          if (!selectedUserIds.has(chosenEntry.user_id)) {
            winnerEntriesSelected.push(chosenEntry);
            selectedUserIds.add(chosenEntry.user_id);
            // Remove all entries of this user to ensure unique winner, OR just remove this entry if same user can win twice
            remainingEntries = remainingEntries.filter(e => e.user_id !== chosenEntry.user_id);
          } else {
            // Backup fallback (should not hit due to filter above)
            remainingEntries.splice(randomIndex, 1);
            i--;
          }
        }

        // 3. Record Winners
        for (let rankIndex = 0; rankIndex < winnerEntriesSelected.length; rankIndex++) {
          const winnerEntry = winnerEntriesSelected[rankIndex];
          const rank = rankIndex + 1;

          // Record winner in DB
          await LuckyDrawWinner.create({
            lucky_draw_id: draw.id,
            user_id: winnerEntry.user_id,
            prize_won: draw.prize_amount,
            rank: rank,
            status: draw.prize_type === 'coins' ? 'paid' : 'pending'
          }, { transaction });

          // If prize is coins, credit user wallet instantly
          if (draw.prize_type === 'coins' && draw.prize_value > 0) {
            const user = await User.findOne({ where: { telegram_id: winnerEntry.user_id } });
            if (user) {
              await user.update({
                balance: user.balance + draw.prize_value,
                total_earned: user.total_earned + draw.prize_value
              }, { transaction });

              // Create transaction record
              await Transaction.create({
                telegram_id: user.telegram_id,
                amount: draw.prize_value,
                type: 'lucky_draw_win',
                description: `Won ${draw.prize_amount} in "${draw.title}"!`,
                reference_id: `LD-${draw.id}-${rank}`,
                status: 'completed'
              }, { transaction });
            }
          }
        }

        // 4. Mark draw as ended
        await draw.update({ status: 'ended' }, { transaction });
        await transaction.commit();
        console.log(`🎰 Draw "${draw.title}" resolved successfully with ${winnerEntriesSelected.length} winners.`);

      } catch (err) {
        await transaction.rollback();
        console.error(`❌ Error resolving draw ID ${draw.id}:`, err);
      }
    }
  } catch (globalErr) {
    console.error("❌ Global processEndedDraws Error:", globalErr);
  }
}

module.exports = {
  processEndedDraws
};
