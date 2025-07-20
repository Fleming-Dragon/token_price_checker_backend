const express = require('express');
const router = express.Router();

// Import route modules
const tokenRoutes = require('./tokens');
const priceRoutes = require('./prices');
const oracleRoutes = require('./oracle');

// Use route modules
router.use('/tokens', tokenRoutes);
router.use('/prices', priceRoutes);
router.use('/oracle', oracleRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'Token Price Checker API with Oracle System',
    version: '2.0.0',
    availableEndpoints: {
      tokens: '/api/tokens',
      prices: '/api/prices',
      oracle: '/api/oracle'
    },
    features: [
      'Token price checking',
      'Historical price oracle',
      'Price interpolation',
      'Automated data collection',
      'Redis caching',
      'MongoDB storage'
    ]
  });
});

module.exports = router;
