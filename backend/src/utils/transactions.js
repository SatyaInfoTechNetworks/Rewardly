const crypto = require('crypto');

/**
 * Generates a human-readable unique transaction ID
 * Format: TXN-YYYYMMDD-RANDOM
 */
const generateTransactionId = (prefix = 'TXN') => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${date}-${random}`;
};

module.exports = { generateTransactionId };
