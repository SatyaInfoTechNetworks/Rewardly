const crypto = require('crypto');

/**
 * Validates the initData received from Telegram Mini App.
 * @param {string} initData - The raw initData string.
 * @param {string} botToken - Your Telegram Bot Token.
 * @returns {boolean} - Returns true if valid, false otherwise.
 */
function validateTelegramInitData(initData, botToken) {
  if (!initData || !botToken) return false;

  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  urlParams.delete('hash');

  const params = Array.from(urlParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(params)
    .digest('hex');

  return calculatedHash === hash;
}

module.exports = { validateTelegramInitData };
