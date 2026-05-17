const express = require('express');
const router = express.Router();
const Contest = require('../models/Contest');
const ContestReward = require('../models/ContestReward');
const ContestEntry = require('../models/ContestEntry');
const { adminAuth } = require('../middlewares/adminAuth');

/**
 * ──── TOURNAMENT & CONTEST MANAGEMENT ENDPOINTS ────
 */

router.get('/contests', adminAuth, async (req, res) => {
  try {
    const contests = await Contest.findAll({
      include: [{ model: ContestReward, as: 'rewards' }],
      order: [['created_at', 'DESC']]
    });
    res.json(contests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/contests', adminAuth, async (req, res) => {
  try {
    const contest = await Contest.create(req.body);
    res.json(contest);
  } catch (err) {
    console.error("Contest Creation Error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/contests/:id', adminAuth, async (req, res) => {
  try {
    const contest = await Contest.findByPk(req.params.id);
    if (!contest) return res.status(404).json({ error: 'Contest not found' });
    await contest.update(req.body);
    res.json(contest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/contests/:id', adminAuth, async (req, res) => {
  try {
    await Contest.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reward Management
router.post('/contests/:id/rewards', adminAuth, async (req, res) => {
  try {
    const reward = await ContestReward.create({ ...req.body, contest_id: req.params.id });
    res.json(reward);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/contests/rewards/:id', adminAuth, async (req, res) => {
  try {
    await ContestReward.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
