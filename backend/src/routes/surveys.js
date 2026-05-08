const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');

// Opinion Universe Credentials
const OU_CONFIG = {
  KEY: '919b7de84581a94fffc10ee0d0f3b4da89e6f8b18bb6e8bb',
  PUBID: '1863',
  APP_ID: 'ID_eb1f5bea3e8caadcfcf6ccb5d35a1d1d',
  BASE_URL: 'https://api.opinionuniverse.com/publisher/offersFeed'
};

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

/**
 * Unified Surveys Endpoint
 * Combines CPX Research and Opinion Universe
 */
router.get('/all', async (req, res) => {
  const userId = req.query.userId || '1981634693';
  
  // CPX Params
  const forwarded = req.headers['x-forwarded-for'];
  let ip = forwarded ? forwarded.split(',')[0] : req.socket.remoteAddress;
  if (ip === '::1' || ip === '127.0.0.1') ip = '106.77.166.201';
  const userAgent = req.headers['user-agent'] || 'Mozilla/5.0';
  const cpxAppId = process.env.CPX_APP_ID;
  const cpxAppHash = process.env.CPX_APP_HASH;
  const secureHash = crypto.createHash('md5').update(`${userId}-${cpxAppHash}`).digest('hex');

  try {
    // 1. Fetch from CPX
    const cpxPromise = fetch(`https://live-api.cpx-research.com/api/get-surveys.php?app_id=${cpxAppId}&ext_user_id=${userId}&output_method=api&ip_user=${ip}&user_agent=${userAgent}&limit=10&secure_hash=${secureHash}`)
      .then(r => r.json())
      .catch(err => ({ status: 'error', surveys: [] }));

    // 2. Fetch from Opinion Universe
    const ouPromise = axios.get(OU_CONFIG.BASE_URL, {
      params: {
        key: OU_CONFIG.KEY,
        pubid: OU_CONFIG.PUBID,
        app_id: OU_CONFIG.APP_ID,
        country: 'IN', // As requested
        platform: 'All',
        type: 'live_surveys'
      },
      timeout: 8000
    }).catch(err => ({ data: { response: { offers: [] } } }));

    const [cpxData, ouResponse] = await Promise.all([cpxPromise, ouPromise]);

    const unifiedSurveys = [];

    // Map CPX Surveys
    if (cpxData.status === 'success' && cpxData.surveys) {
      cpxData.surveys.forEach(s => {
        unifiedSurveys.push({
          id: `cpx-${s.id}`,
          title: s.category ? `${s.category} Survey` : "Market Research",
          time: `${s.loi} mins`,
          rating: s.statistics_rating_count.toString(),
          reward: Math.floor(parseFloat(s.payout)),
          href: s.href_new,
          source: 'cpx'
        });
      });
    }

    // Map Opinion Universe Surveys
    const ouOffers = ouResponse.data?.response?.offers || [];
    ouOffers.forEach(o => {
      // Replace Tracking Placeholders
      let finalLink = o.offer_url_easy || '';
      finalLink = finalLink.replace(/{YOUR_CLICK_ID}/g, userId);
      finalLink = finalLink.replace(/{YOUR_SOURCE_ID}/g, userId);

      unifiedSurveys.push({
        id: `ou-${o.offer_id}`,
        title: `Survey ${o.offer_id}`, // As requested
        time: `${o.loi || 10} mins`,
        rating: (o.ir || 95).toString(),
        reward: Math.floor(parseFloat(o.amount)), // amount is coins
        href: finalLink,
        image: o.image_url,
        source: 'opinion_universe'
      });
    });

    res.json({
      status: 'success',
      surveys: unifiedSurveys
    });

  } catch (error) {
    console.error('Unified Surveys Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
