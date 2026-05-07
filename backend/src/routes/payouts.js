const express = require('express');
const router = express.Router();
const PayoutMethod = require('../models/PayoutMethod');
const PayoutTier = require('../models/PayoutTier');

/**
 * GET /api/payouts
 * Returns all active payout methods with their tiers
 */
router.get('/', async (req, res) => {
  try {
    const methods = await PayoutMethod.findAll({
      where: { status: 'active' },
      order: [['order_index', 'ASC']],
      include: [{
        model: PayoutTier,
        as: 'tiers',
        where: { status: 'active' }
      }]
    });
    res.json(methods);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
