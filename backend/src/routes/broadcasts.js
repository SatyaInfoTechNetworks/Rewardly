const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const Broadcast = require('../models/Broadcast');
const BroadcastLog = require('../models/BroadcastLog');
const User = require('../models/User');
const { adminAuth } = require('../middlewares/adminAuth');
const { queueCampaign } = require('../utils/scheduler');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/broadcasts');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 1. Multer Configuration for Media uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // Max 50MB for video uploads
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|mp4|webm|mpeg|avi/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Error: Only images (jpg, png, gif) and videos (mp4, webm) are allowed!'));
  }
});

// --- ADMIN ROUTES ---

// A. Upload Media
router.post('/broadcasts/upload', adminAuth, upload.single('media'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a file' });
    }
    
    const fileUrl = `/uploads/broadcasts/${req.file.filename}`;
    res.json({
      success: true,
      url: fileUrl
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// B. List Broadcast Campaigns with aggregate statistics
router.get('/broadcasts', adminAuth, async (req, res) => {
  try {
    const broadcasts = await Broadcast.findAll({
      order: [['created_at', 'DESC']]
    });

    // Fetch aggregate statistics from Logs to enrich response
    const enrichedBroadcasts = await Promise.all(broadcasts.map(async (broadcast) => {
      const stats = await BroadcastLog.findOne({
        where: { broadcast_id: broadcast.id },
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
          [sequelize.literal("SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END)"), 'success'],
          [sequelize.literal("SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END)"), 'failed'],
          [sequelize.literal("SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END)"), 'blocked'],
          [sequelize.literal("SUM(clicked)"), 'clicks'],
          [sequelize.literal("SUM(opened)"), 'opens']
        ],
        raw: true
      });

      return {
        ...broadcast.toJSON(),
        stats: {
          total: parseInt(stats.total) || 0,
          success: parseInt(stats.success) || 0,
          failed: parseInt(stats.failed) || 0,
          blocked: parseInt(stats.blocked) || 0,
          clicks: parseInt(stats.clicks) || 0,
          opens: parseInt(stats.opens) || 0,
          ctr: stats.success > 0 ? parseFloat(((parseInt(stats.clicks) / parseInt(stats.success)) * 100).toFixed(1)) : 0
        }
      };
    }));

    res.json(enrichedBroadcasts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// C. Create Broadcast Campaign
router.post('/broadcasts', adminAuth, async (req, res) => {
  try {
    const { title, message, media_type, media_url, button_text, button_url, target_type, schedule_time, status } = req.body;

    const broadcast = await Broadcast.create({
      title,
      message,
      media_type: media_type || 'none',
      media_url: media_url || null,
      button_text: button_text || null,
      button_url: button_url || null,
      target_type,
      scheduled_at: schedule_time ? new Date(schedule_time) : null,
      status: status || 'draft'
    });

    // If campaign is set to start immediately
    if (status === 'running') {
      queueCampaign(broadcast); // Run async in background
    }

    res.json({ success: true, broadcast });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// D. Get Single Broadcast Details & logs breakdown
router.get('/broadcasts/:id', adminAuth, async (req, res) => {
  try {
    const broadcast = await Broadcast.findByPk(req.params.id);
    if (!broadcast) return res.status(404).json({ error: 'Broadcast not found' });

    const logs = await BroadcastLog.findAll({
      where: { broadcast_id: broadcast.id },
      order: [['updated_at', 'DESC']],
      limit: 100 // Return last 100 deliveries for visual audit
    });

    const stats = await BroadcastLog.findOne({
      where: { broadcast_id: broadcast.id },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.literal("SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END)"), 'success'],
        [sequelize.literal("SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END)"), 'failed'],
        [sequelize.literal("SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END)"), 'blocked'],
        [sequelize.literal("SUM(clicked)"), 'clicks'],
        [sequelize.literal("SUM(opened)"), 'opens']
      ],
      raw: true
    });

    res.json({
      broadcast,
      logs,
      analytics: {
        total: parseInt(stats.total) || 0,
        success: parseInt(stats.success) || 0,
        failed: parseInt(stats.failed) || 0,
        blocked: parseInt(stats.blocked) || 0,
        clicks: parseInt(stats.clicks) || 0,
        opens: parseInt(stats.opens) || 0,
        ctr: stats.success > 0 ? parseFloat(((parseInt(stats.clicks) / parseInt(stats.success)) * 100).toFixed(1)) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// E. Update Draft Broadcast Campaign
router.put('/broadcasts/:id', adminAuth, async (req, res) => {
  try {
    const broadcast = await Broadcast.findByPk(req.params.id);
    if (!broadcast) return res.status(404).json({ error: 'Broadcast not found' });

    if (broadcast.status === 'running' || broadcast.status === 'completed') {
      return res.status(400).json({ error: 'Cannot modify a campaign that is currently running or finished.' });
    }

    const { title, message, media_type, media_url, button_text, button_url, target_type, schedule_time, status } = req.body;

    await broadcast.update({
      title,
      message,
      media_type,
      media_url: media_url || null,
      button_text: button_text || null,
      button_url: button_url || null,
      target_type,
      scheduled_at: schedule_time ? new Date(schedule_time) : null,
      status: status || 'draft'
    });

    if (status === 'running') {
      queueCampaign(broadcast);
    }

    res.json({ success: true, broadcast });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// F. Delete Broadcast Campaign
router.delete('/broadcasts/:id', adminAuth, async (req, res) => {
  try {
    const broadcast = await Broadcast.findByPk(req.params.id);
    if (!broadcast) return res.status(404).json({ error: 'Broadcast not found' });

    // Clean logs associated with this broadcast
    await BroadcastLog.destroy({ where: { broadcast_id: broadcast.id } });
    await broadcast.destroy();

    res.json({ success: true, message: 'Broadcast campaign and logs deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// G. Trigger Send immediately
router.post('/broadcasts/:id/send', adminAuth, async (req, res) => {
  try {
    const broadcast = await Broadcast.findByPk(req.params.id);
    if (!broadcast) return res.status(404).json({ error: 'Broadcast not found' });

    if (broadcast.status === 'running') {
      return res.status(400).json({ error: 'Campaign is already running.' });
    }

    queueCampaign(broadcast); // Non-blocking
    res.json({ success: true, message: 'Broadcast sending engine started successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// G2. List Uploaded Media files
router.get('/broadcasts/media', adminAuth, async (req, res) => {
  try {
    const files = await fs.promises.readdir(uploadDir);
    const mediaList = [];

    for (const filename of files) {
      const filePath = path.join(uploadDir, filename);
      const stat = await fs.promises.stat(filePath);
      
      if (stat.isFile()) {
        const fileExt = path.extname(filename).toLowerCase();
        let fileType = 'unknown';
        if (['.jpg', '.jpeg', '.png', '.webp'].includes(fileExt)) {
          fileType = 'image';
        } else if (['.mp4', '.webm', '.mpeg', '.avi'].includes(fileExt)) {
          fileType = 'video';
        } else if (['.gif'].includes(fileExt)) {
          fileType = 'gif';
        }

        mediaList.push({
          filename,
          url: `/uploads/broadcasts/${filename}`,
          sizeBytes: stat.size,
          createdAt: stat.birthtime,
          fileType
        });
      }
    }

    mediaList.sort((a, b) => b.createdAt - a.createdAt);
    res.json(mediaList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// G3. Delete Uploaded Media file
router.delete('/broadcasts/media/:filename', adminAuth, async (req, res) => {
  try {
    const { filename } = req.params;
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const filePath = path.join(uploadDir, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    await fs.promises.unlink(filePath);
    res.json({ success: true, message: 'File deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- PUBLIC TRACKING ROUTE ---

// Click redirect tracker (No adminAuth middleware)
router.get('/broadcasts/track-click', async (req, res) => {
  const { logId, url } = req.query;

  if (!logId || !url) {
    return res.status(400).send('Invalid redirect request.');
  }

  try {
    const log = await BroadcastLog.findByPk(logId);
    if (log) {
      // Set click parameter
      await log.update({ clicked: 1 });

      // Increment total clicks count for User
      const user = await User.findByPk(log.user_id);
      if (user) {
        await user.increment('notification_clicks', { by: 1 });
      }
    }
  } catch (err) {
    console.error('❌ Error logging redirect click CTR:', err);
  }

  // Always perform final redirect to requested destination link
  res.redirect(url);
});

module.exports = router;
