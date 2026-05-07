const express = require('express');
const router = express.Router();
const crypto = require('crypto');

/**
 * Proxy for CPX Research Surveys
 * Handles real-IP detection and secure hash generation
 */
router.get('/cpx', async (req, res) => {
  const userId = req.query.userId || '1981634693';
  
  // Real IP Detection
  const forwarded = req.headers['x-forwarded-for'];
  let ip = forwarded ? forwarded.split(',')[0] : req.socket.remoteAddress;
  
  // Clean IPv6 loopback if necessary
  if (ip === '::1' || ip === '127.0.0.1') {
    ip = '106.77.166.201'; // User's confirmed working IP for local testing
  }

  const userAgent = req.headers['user-agent'] || 'Mozilla/5.0';

  const APP_ID = process.env.CPX_APP_ID;
  const APP_HASH = process.env.CPX_APP_HASH;
  
  // Generate Secure Hash (md5(userId-secret))
  const hashInput = `${userId}-${APP_HASH}`;
  const secureHash = crypto.createHash('md5').update(hashInput).digest('hex');
  
  // Construct CPX URL
  const cpxUrl = new URL('https://live-api.cpx-research.com/api/get-surveys.php');
  cpxUrl.searchParams.append('app_id', APP_ID);
  cpxUrl.searchParams.append('ext_user_id', userId);
  cpxUrl.searchParams.append('output_method', 'api');
  cpxUrl.searchParams.append('ip_user', ip);
  cpxUrl.searchParams.append('user_agent', userAgent);
  cpxUrl.searchParams.append('limit', '12');
  cpxUrl.searchParams.append('secure_hash', secureHash);

  try {
    const response = await fetch(cpxUrl.toString());
    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.error('CPX Backend Proxy Error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch surveys' });
  }
});

module.exports = router;
