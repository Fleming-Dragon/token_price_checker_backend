const express = require('express');
const router = express.Router();
const priceController = require('../controllers/priceController');

// GET /api/prices/:symbol - Get current price for a token
router.get('/:symbol', priceController.getTokenPrice);

// GET /api/prices/:symbol/history - Get price history for a token
router.get('/:symbol/history', priceController.getTokenPriceHistory);

// POST /api/prices/bulk - Get prices for multiple tokens
router.post('/bulk', priceController.getBulkTokenPrices);

// GET /api/prices/:symbol/chart - Get chart data for a token
router.get('/:symbol/chart', priceController.getTokenChartData);

module.exports = router;
