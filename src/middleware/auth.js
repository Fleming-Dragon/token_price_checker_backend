const { HTTP_STATUS } = require('../constants');
const { AppError } = require('./errorHandler');

// API Key authentication middleware
const apiKeyAuth = (req, res, next) => {
  const apiKey = req.header('X-API-Key') || req.query.apiKey;

  if (!apiKey) {
    return next(new AppError('API key is required', HTTP_STATUS.UNAUTHORIZED));
  }

  // In production, validate against a database or secure store
  const validApiKeys = process.env.VALID_API_KEYS
    ? process.env.VALID_API_KEYS.split(',')
    : ['dev-api-key-123'];

  if (!validApiKeys.includes(apiKey)) {
    return next(new AppError('Invalid API key', HTTP_STATUS.UNAUTHORIZED));
  }

  req.apiKey = apiKey;
  next();
};

// Optional API key authentication (allows requests without API key but logs them)
const optionalApiKeyAuth = (req, res, next) => {
  const apiKey = req.header('X-API-Key') || req.query.apiKey;

  if (apiKey) {
    const validApiKeys = process.env.VALID_API_KEYS
      ? process.env.VALID_API_KEYS.split(',')
      : ['dev-api-key-123'];

    if (validApiKeys.includes(apiKey)) {
      req.apiKey = apiKey;
      req.authenticated = true;
    } else {
      req.authenticated = false;
      console.warn(`Invalid API key attempted: ${apiKey.substring(0, 8)}...`);
    }
  } else {
    req.authenticated = false;
  }

  next();
};

// Role-based access control
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.authenticated) {
      return next(
        new AppError('Authentication required', HTTP_STATUS.UNAUTHORIZED)
      );
    }

    // In a real application, you'd fetch user roles from a database
    const userRole = req.user?.role || 'guest';

    if (!roles.includes(userRole)) {
      return next(
        new AppError('Insufficient permissions', HTTP_STATUS.FORBIDDEN)
      );
    }

    next();
  };
};

// IP whitelist middleware
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    if (allowedIPs.length === 0) {
      return next(); // No restriction if list is empty
    }

    const clientIP =
      req.ip ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection.socket ? req.connection.socket.remoteAddress : null);

    if (!allowedIPs.includes(clientIP)) {
      return next(
        new AppError(
          'Access denied from this IP address',
          HTTP_STATUS.FORBIDDEN
        )
      );
    }

    next();
  };
};

module.exports = {
  apiKeyAuth,
  optionalApiKeyAuth,
  requireRole,
  ipWhitelist
};
