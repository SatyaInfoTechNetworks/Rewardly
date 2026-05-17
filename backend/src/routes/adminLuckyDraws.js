const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const LuckyDraw = require('../models/LuckyDraw');
const LuckyDrawEntry = require('../models/LuckyDrawEntry');
const LuckyDrawWinner = require('../models/LuckyDrawWinner');
const { adminAuth } = require('../middlewares/adminAuth');
const { sequelize } = require('../database/connection');

/**
 * ──── LUCKY DRAW MANAGEMENT ENDPOINTS ────
 */

// 1. GET /api/admin/lucky-draws - List all draws with metrics
router.get('/lucky-draws', adminAuth, async (req, res) => {
  try {
    const draws = await LuckyDraw.findAll({
      order: [['created_at', 'DESC']]
    });

    const enrichedDraws = await Promise.all(draws.map(async (d) => {
      const totalEntries = await LuckyDrawEntry.count({ where: { lucky_draw_id: d.id } });
      const uniqueParticipants = await LuckyDrawEntry.count({
        where: { lucky_draw_id: d.id },
        distinct: true,
        col: 'user_id'
      });
      const adEntries = await LuckyDrawEntry.count({ where: { lucky_draw_id: d.id, entry_source: 'ad' } });
      const coinEntries = await LuckyDrawEntry.count({ where: { lucky_draw_id: d.id, entry_source: 'coins' } });

      const winners = await LuckyDrawWinner.findAll({
        where: { lucky_draw_id: d.id },
        include: [{ model: User, attributes: ['first_name', 'username', 'photo_url'] }]
      });

      return {
        ...d.toJSON(),
        totalEntries,
        participantsCount: uniqueParticipants,
        adEntries,
        coinEntries,
        winners
      };
    }));

    res.json(enrichedDraws);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. POST /api/admin/lucky-draws - Create a new draw
router.post('/lucky-draws', adminAuth, async (req, res) => {
  try {
    const draw = await LuckyDraw.create(req.body);
    res.json(draw);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. PUT /api/admin/lucky-draws/:id - Update existing draw
router.put('/lucky-draws/:id', adminAuth, async (req, res) => {
  try {
    const draw = await LuckyDraw.findByPk(req.params.id);
    if (!draw) return res.status(404).json({ error: 'Draw not found' });
    await draw.update(req.body);
    res.json(draw);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. DELETE /api/admin/lucky-draws/:id - Delete draw
router.delete('/lucky-draws/:id', adminAuth, async (req, res) => {
  try {
    await LuckyDrawEntry.destroy({ where: { lucky_draw_id: req.params.id } });
    await LuckyDrawWinner.destroy({ where: { lucky_draw_id: req.params.id } });
    await LuckyDraw.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. GET /api/admin/lucky-draws/:id/entries - View participant entries
router.get('/lucky-draws/:id/entries', adminAuth, async (req, res) => {
  try {
    const entries = await LuckyDrawEntry.findAll({
      where: { lucky_draw_id: req.params.id },
      include: [
        {
          model: User,
          attributes: ['first_name', 'username', 'photo_url']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. POST /api/admin/lucky-draws/:id/roll - Manually roll winner selection
router.post('/lucky-draws/:id/roll', adminAuth, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const draw = await LuckyDraw.findByPk(req.params.id);
    if (!draw) return res.status(404).json({ error: 'Lucky Draw not found' });
    
    // Check if already has winners
    const existingWinners = await LuckyDrawWinner.count({ where: { lucky_draw_id: draw.id } });
    if (existingWinners > 0) {
      return res.status(400).json({ error: 'This draw has already selected winners. You cannot roll again.' });
    }

    const entries = await LuckyDrawEntry.findAll({ where: { lucky_draw_id: draw.id } });
    if (entries.length === 0) {
      return res.status(400).json({ error: 'Cannot roll winners. No participants have entered this draw.' });
    }

    // Weighted selection (unique users only)
    const winnerEntriesSelected = [];
    const winnersCountToSelect = Math.min(draw.winners_count || 1, entries.length);
    let remainingEntries = [...entries];
    const selectedUserIds = new Set();

    for (let i = 0; i < winnersCountToSelect; i++) {
      if (remainingEntries.length === 0) break;
      const randomIndex = Math.floor(Math.random() * remainingEntries.length);
      const chosenEntry = remainingEntries[randomIndex];
      
      if (!selectedUserIds.has(chosenEntry.user_id)) {
        winnerEntriesSelected.push(chosenEntry);
        selectedUserIds.add(chosenEntry.user_id);
        remainingEntries = remainingEntries.filter(e => e.user_id !== chosenEntry.user_id);
      } else {
        remainingEntries.splice(randomIndex, 1);
        i--;
      }
    }

    // Record Winners
    for (let rankIndex = 0; rankIndex < winnerEntriesSelected.length; rankIndex++) {
      const winnerEntry = winnerEntriesSelected[rankIndex];
      const rank = rankIndex + 1;

      await LuckyDrawWinner.create({
        lucky_draw_id: draw.id,
        user_id: winnerEntry.user_id,
        prize_won: draw.prize_amount,
        rank: rank,
        status: draw.prize_type === 'coins' ? 'paid' : 'pending'
      }, { transaction: t });

      if (draw.prize_type === 'coins' && draw.prize_value > 0) {
        const user = await User.findOne({ where: { telegram_id: winnerEntry.user_id } });
        if (user) {
          await user.update({
            balance: user.balance + draw.prize_value,
            total_earned: user.total_earned + draw.prize_value
          }, { transaction: t });

          await Transaction.create({
            telegram_id: user.telegram_id,
            amount: draw.prize_value,
            type: 'lucky_draw_win',
            description: `Won ${draw.prize_amount} in "${draw.title}"!`,
            reference_id: `LD-MANUAL-${draw.id}-${rank}`,
            status: 'completed'
          }, { transaction: t });
        }
      }
    }

    await draw.update({ status: 'ended' }, { transaction: t });
    await t.commit();

    res.json({ success: true, message: 'Winners rolled and rewarded successfully!' });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: err.message });
  }
});

// 7. PUT /api/admin/lucky-draws/winners/:id - Mark prize as delivered/paid
router.put('/lucky-draws/winners/:id', adminAuth, async (req, res) => {
  try {
    const winner = await LuckyDrawWinner.findByPk(req.params.id);
    if (!winner) return res.status(404).json({ error: 'Winner entry not found' });
    
    const { status, proof_image } = req.body;
    if (status !== undefined) winner.status = status;
    if (proof_image !== undefined) winner.proof_image = proof_image;
    
    await winner.save();
    res.json({ success: true, winner });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. GET /api/admin/lucky-draws/stats - Metrics overview
router.get('/lucky-draws/stats', adminAuth, async (req, res) => {
  try {
    const totalDraws = await LuckyDraw.count();
    const totalEntries = await LuckyDrawEntry.count();
    const totalParticipants = await LuckyDrawEntry.count({ distinct: true, col: 'user_id' });
    const adEntries = await LuckyDrawEntry.count({ where: { entry_source: 'ad' } });
    const coinEntries = await LuckyDrawEntry.count({ where: { entry_source: 'coins' } });
    
    // Estimate ad revenue based on eCPM of $2 per 1000 views
    const revenueEstimate = ((adEntries * 2) / 1000).toFixed(2);

    res.json({
      totalDraws,
      totalEntries,
      totalParticipants,
      adEntries,
      coinEntries,
      revenueEstimate
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
