const tokenService = require('../services/tokenService');

class TokenController {
  // Get all supported tokens
  async getAllTokens(req, res) {
    try {
      const { page = 1, limit = 100, sort = 'market_cap' } = req.query;

      const tokens = await tokenService.getAllTokens({
        page: parseInt(page),
        limit: parseInt(limit),
        sort
      });

      res.json({
        success: true,
        data: tokens,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Error getting all tokens:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch tokens',
        message: error.message
      });
    }
  }

  // Get specific token by symbol
  async getTokenBySymbol(req, res) {
    try {
      const { symbol } = req.params;

      if (!symbol) {
        return res.status(400).json({
          success: false,
          error: 'Token symbol is required'
        });
      }

      const token = await tokenService.getTokenBySymbol(symbol.toUpperCase());

      if (!token) {
        return res.status(404).json({
          success: false,
          error: 'Token not found'
        });
      }

      res.json({
        success: true,
        data: token
      });
    } catch (error) {
      console.error('Error getting token by symbol:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch token',
        message: error.message
      });
    }
  }

  // Search tokens by name or symbol
  async searchTokens(req, res) {
    try {
      const { query } = req.params;
      const { limit = 10 } = req.query;

      if (!query || query.length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Search query must be at least 2 characters long'
        });
      }

      const tokens = await tokenService.searchTokens(query, parseInt(limit));

      res.json({
        success: true,
        data: tokens,
        query: query
      });
    } catch (error) {
      console.error('Error searching tokens:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search tokens',
        message: error.message
      });
    }
  }
}

module.exports = new TokenController();
