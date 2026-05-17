const axios = require('axios');

const BOT_TOKEN = '8441190461:AAErfv2dgLp7DiWuo85RmnFL7AS3HwHu1W0';
const ADMIN_CHAT_ID = '1981634693';

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Sends a Telegram notification to the Admin on offerwall completion
 */
async function sendCompletionAlert({ offerName, offerwall, amount, transactionId, username, firstName, telegramId }) {
  try {
    const userDisplay = username ? `@${username}` : (firstName || telegramId || 'Unknown User');
    
    const escapedUserDisplay = escapeHtml(userDisplay);
    const escapedOfferName = escapeHtml(offerName || 'Offer Completion');
    const escapedOfferwall = escapeHtml(offerwall);
    const escapedAmount = escapeHtml(amount);
    const escapedTxId = escapeHtml(transactionId || 'N/A');

    const message = `🎉 <b>Offerwall Completion Alert</b>

👤 <b>User:</b> ${escapedUserDisplay} (tg: ${telegramId || 'N/A'})
🔥 <b>Offer Name:</b> ${escapedOfferName}
🏢 <b>Offerwall:</b> ${escapedOfferwall}
💰 <b>Coins Credited:</b> +${escapedAmount} Coins
🆔 <b>Transaction ID:</b> <code>${escapedTxId}</code>

⚡ <b>Powered by Rewardly</b>`;

    console.log(`📡 Sending Telegram Alert for offer ${offerName} to Admin ${ADMIN_CHAT_ID}...`);
    
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: ADMIN_CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    });

    console.log(`✅ Telegram Alert sent successfully.`);
  } catch (error) {
    console.error('❌ Failed to send Telegram Alert:', error.response?.data || error.message);
  }
}

async function sendChargebackAlert({ offerName, offerwall, amount, transactionId, username, firstName, telegramId, reason }) {
  try {
    const userDisplay = username ? `@${username}` : (firstName || telegramId || 'Unknown User');
    
    const escapedUserDisplay = escapeHtml(userDisplay);
    const escapedOfferName = escapeHtml(offerName || 'Offer Reversal');
    const escapedOfferwall = escapeHtml(offerwall);
    const escapedAmount = escapeHtml(amount);
    const escapedTxId = escapeHtml(transactionId || 'N/A');
    const escapedReason = escapeHtml(reason || 'Fraud chargeback / offer reversal');

    const message = `⚠️ <b>Offerwall Chargeback Alert</b>

👤 <b>User:</b> ${escapedUserDisplay} (tg: ${telegramId || 'N/A'})
🔥 <b>Offer Name:</b> ${escapedOfferName}
🏢 <b>Offerwall:</b> ${escapedOfferwall}
📉 <b>Coins Deducted:</b> -${escapedAmount} Coins
🆔 <b>Transaction ID:</b> <code>${escapedTxId}</code>
🚨 <b>Reason:</b> ${escapedReason}

⚡ <b>Powered by Rewardly</b>`;

    console.log(`📡 Sending Telegram Chargeback Alert for offer ${offerName} to Admin ${ADMIN_CHAT_ID}...`);
    
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: ADMIN_CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    });

    console.log(`✅ Telegram Chargeback Alert sent successfully.`);
  } catch (error) {
    console.error('❌ Failed to send Telegram Chargeback Alert:', error.response?.data || error.message);
  }
}

module.exports = { sendCompletionAlert, sendChargebackAlert };
