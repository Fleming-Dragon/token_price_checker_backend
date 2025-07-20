// Validation middleware functions
const validateSymbol = (req, res, next) => {
  const { symbol } = req.params;

  if (!symbol) {
    return res.status(400).json({
      success: false,
      error: 'Symbol parameter is required'
    });
  }

  if (typeof symbol !== 'string' || symbol.length < 1 || symbol.length > 10) {
    return res.status(400).json({
      success: false,
      error: 'Symbol must be a string between 1 and 10 characters'
    });
  }

  // Convert to uppercase for consistency
  req.params.symbol = symbol.toUpperCase();
  next();
};

const validatePagination = (req, res, next) => {
  const { page = 1, limit = 100 } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  if (isNaN(pageNum) || pageNum < 1) {
    return res.status(400).json({
      success: false,
      error: 'Page must be a positive integer'
    });
  }

  if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
    return res.status(400).json({
      success: false,
      error: 'Limit must be a positive integer between 1 and 1000'
    });
  }

  req.query.page = pageNum;
  req.query.limit = limitNum;
  next();
};

const validateCurrency = (req, res, next) => {
  const { currency = 'USD' } = req.query;

  const validCurrencies = [
    'USD',
    'EUR',
    'BTC',
    'ETH',
    'GBP',
    'JPY',
    'CAD',
    'AUD'
  ];

  if (!validCurrencies.includes(currency.toUpperCase())) {
    return res.status(400).json({
      success: false,
      error: `Invalid currency. Supported currencies: ${validCurrencies.join(
        ', '
      )}`
    });
  }

  req.query.currency = currency.toUpperCase();
  next();
};

const validatePeriod = (req, res, next) => {
  const { period = '7d' } = req.query;

  const validPeriods = ['1h', '24h', '7d', '30d', '90d', '1y'];

  if (!validPeriods.includes(period)) {
    return res.status(400).json({
      success: false,
      error: `Invalid period. Supported periods: ${validPeriods.join(', ')}`
    });
  }

  next();
};

const validateBulkRequest = (req, res, next) => {
  const { symbols } = req.body;

  if (!symbols || !Array.isArray(symbols)) {
    return res.status(400).json({
      success: false,
      error: 'Symbols must be an array'
    });
  }

  if (symbols.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Symbols array cannot be empty'
    });
  }

  if (symbols.length > 100) {
    return res.status(400).json({
      success: false,
      error: 'Maximum 100 symbols allowed per request'
    });
  }

  // Validate each symbol
  const invalidSymbols = symbols.filter(
    (symbol) =>
      typeof symbol !== 'string' || symbol.length < 1 || symbol.length > 10
  );

  if (invalidSymbols.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'All symbols must be strings between 1 and 10 characters',
      invalidSymbols
    });
  }

  // Convert all symbols to uppercase
  req.body.symbols = symbols.map((symbol) => symbol.toUpperCase());
  next();
};

const validateSearchQuery = (req, res, next) => {
  const { query } = req.params;

  if (!query) {
    return res.status(400).json({
      success: false,
      error: 'Search query is required'
    });
  }

  if (typeof query !== 'string' || query.length < 2) {
    return res.status(400).json({
      success: false,
      error: 'Search query must be at least 2 characters long'
    });
  }

  if (query.length > 50) {
    return res.status(400).json({
      success: false,
      error: 'Search query must be less than 50 characters'
    });
  }

  next();
};

module.exports = {
  validateSymbol,
  validatePagination,
  validateCurrency,
  validatePeriod,
  validateBulkRequest,
  validateSearchQuery
};
