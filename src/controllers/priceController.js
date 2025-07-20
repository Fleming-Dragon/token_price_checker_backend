const priceService = require('../services/priceService');

class PriceController {
  // Get current price for a token
  async getTokenPrice(req, res) {
    try {
      const { symbol } = req.params;
      const { currency = 'USD' } = req.query;

      if (!symbol) {
        return res.status(400).json({
          success: false,
          error: 'Token symbol is required'
        });
      }

      const price = await priceService.getTokenPrice(
        symbol.toUpperCase(),
        currency.toUpperCase()
      );

      if (!price) {
        return res.status(404).json({
          success: false,
          error: 'Price data not found for this token'
        });
      }

      res.json({
        success: true,
        data: price
      });
    } catch (error) {
      console.error('Error getting token price:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch token price',
        message: error.message
      });
    }
  }

  // Get price history for a token
  async getTokenPriceHistory(req, res) {
    try {
      const { symbol } = req.params;
      const { period = '7d', currency = 'USD', interval = '1d' } = req.query;

      if (!symbol) {
        return res.status(400).json({
          success: false,
          error: 'Token symbol is required'
        });
      }

      const history = await priceService.getTokenPriceHistory(
        symbol.toUpperCase(),
        period,
        currency.toUpperCase(),
        interval
      );

      res.json({
        success: true,
        data: history,
        parameters: {
          symbol: symbol.toUpperCase(),
          period,
          currency: currency.toUpperCase(),
          interval
        }
      });
    } catch (error) {
      console.error('Error getting token price history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch price history',
        message: error.message
      });
    }
  }

  // Get prices for multiple tokens
  async getBulkTokenPrices(req, res) {
    try {
      const { symbols, currency = 'USD' } = req.body;

      if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Symbols array is required and must not be empty'
        });
      }

      if (symbols.length > 100) {
        return res.status(400).json({
          success: false,
          error: 'Maximum 100 symbols allowed per request'
        });
      }

      const upperCaseSymbols = symbols.map((symbol) => symbol.toUpperCase());
      const prices = await priceService.getBulkTokenPrices(
        upperCaseSymbols,
        currency.toUpperCase()
      );

      res.json({
        success: true,
        data: prices,
        count: Object.keys(prices).length
      });
    } catch (error) {
      console.error('Error getting bulk token prices:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch bulk token prices',
        message: error.message
      });
    }
  }

  // Get chart data for a token
  async getTokenChartData(req, res) {
    try {
      const { symbol } = req.params;
      const { period = '24h', currency = 'USD', points = 100 } = req.query;

      if (!symbol) {
        return res.status(400).json({
          success: false,
          error: 'Token symbol is required'
        });
      }

      const chartData = await priceService.getTokenChartData(
        symbol.toUpperCase(),
        period,
        currency.toUpperCase(),
        parseInt(points)
      );

      res.json({
        success: true,
        data: chartData,
        parameters: {
          symbol: symbol.toUpperCase(),
          period,
          currency: currency.toUpperCase(),
          points: parseInt(points)
        }
      });
    } catch (error) {
      console.error('Error getting token chart data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch chart data',
        message: error.message
      });
    }
  }
}

module.exports = new PriceController();
