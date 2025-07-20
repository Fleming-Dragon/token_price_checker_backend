const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/tokenController');

// GET /api/tokens - Get all supported tokens
router.get('/', tokenController.getAllTokens);

// GET /api/tokens/:symbol - Get specific token information
router.get('/:symbol', tokenController.getTokenBySymbol);

// GET /api/tokens/search/:query - Search tokens by name or symbol
router.get('/search/:query', tokenController.searchTokens);

module.exports = router;
