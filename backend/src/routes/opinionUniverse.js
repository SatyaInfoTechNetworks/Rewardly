const express = require('express');
const router = express.Router();
const axios = require('axios');

// Opinion Universe Credentials
const CONFIG = {
  KEY: '919b7de84581a94fffc10ee0d0f3b4da89e6f8b18bb6e8bb',
  PUBID: '1863',
  APP_ID: 'ID_eb1f5bea3e8caadcfcf6ccb5d35a1d1d',
  BASE_URL: 'https://api.opinionuniverse.com/publisher/offersFeed'
};

/**
 * GET /api/opinion-universe/test
 */
router.get('/test', async (req, res) => {
  try {
    const { country = 'IN', platform = 'All' } = req.query;

    const params = {
      key: CONFIG.KEY,
      pubid: CONFIG.PUBID,
      app_id: CONFIG.APP_ID,
      country: country,
      platform: platform,
      type: 'live_surveys'
    };

    console.log('[OpinionUniverse] Fetching offers with params:', params);

    const response = await axios.get(CONFIG.BASE_URL, { 
      params,
      timeout: 10000 // 10s timeout
    });
    
    console.log('[OpinionUniverse] Success! Found', response.data?.data?.response?.offers?.length || 0, 'offers');
    res.json(response.data);
  } catch (err) {
    console.error('[OpinionUniverse] Error fetching offers:', err.message);
    if (err.response) {
      console.error('[OpinionUniverse] API Response Error:', err.response.data);
    }
    
    res.status(err.response?.status || 500).json({ 
      error: 'Failed to fetch offers', 
      message: err.message,
      details: err.response?.data
    });
  }
});

module.exports = router;
