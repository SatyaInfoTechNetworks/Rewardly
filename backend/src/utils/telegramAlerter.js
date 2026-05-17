const axios = require('axios');

const BOT_TOKEN = '8441190461:AAErfv2dgLp7DiWuo85RmnFL7AS3HwHu1W0';
const ADMIN_CHAT_ID = '1981634693';

/**
 * Sends a Telegram notification to the Admin on offerwall completion
 * @param {Object} params
 * @param {string} params.offerName - Name of the survey or offer completed
 * @param {string} params.offerwall - Name of the offerwall (e.g. CPX Research, PubScale, Opinion Universe)
 * @param {number|string} params.amount - Coins credited to the user
 * @param {string} params.transactionId - Transaction reference ID
 * @param {string} params.username - Username of the user who completed the offer
 * @param {string} params.firstName - First name of the user
 * @param {string} params.telegramId - Telegram ID of the user
 */
async function sendCompletionAlert({ offerName, offerwall, amount, transactionId, username, firstName, telegramId }) {
  try {
    const userDisplay = username ? `@${username}` : (firstName || telegramId || 'Unknown User');
    const escapedUserDisplay = String(userDisplay).replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
    const escapedOfferName = String(offerName || 'Offer Completion').replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
    const escapedOfferwall = String(offerwall).replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
    const escapedAmount = String(amount).replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
    const escapedTxId = String(transactionId || 'N/A').replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');

    const message = `🎉 *Offerwall Completion Alert*

👤 *User:* ${escapedUserDisplay} \(_tg: ${telegramId || 'N/A'}_\)
🔥 *Offer Name:* ${escapedOfferName}
🏢 *Offerwall:* ${escapedOfferwall}
💰 *Coins Credited:* \+${escapedAmount} Coins
🆔 *Transaction ID:* \`${escapedTxId}\`

⚡ *Powered by Rewardly*`;

    console.log(`📡 Sending Telegram Alert for offer ${offerName} to Admin ${ADMIN_CHAT_ID}...`);
    
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: ADMIN_CHAT_ID,
      text: message,
      parse_mode: 'MarkdownV2'
    });

    console.log(`✅ Telegram Alert sent successfully.`);
  } catch (error) {
    console.error('❌ Failed to send Telegram Alert:', error.response?.data || error.message);
  }
}

module.exports = { sendCompletionAlert };
