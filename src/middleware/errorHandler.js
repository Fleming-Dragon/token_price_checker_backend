const { HTTP_STATUS } = require('../constants');

class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Database error handler
const handleDatabaseError = (error) => {
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map((err) => ({
      field: err.path,
      message: err.message,
      value: err.value
    }));

    return {
      status: HTTP_STATUS.BAD_REQUEST,
      message: 'Validation failed',
      errors
    };
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || 'unknown field';
    return {
      status: HTTP_STATUS.BAD_REQUEST,
      message: `Duplicate value for ${field}`,
      field
    };
  }

  if (error.name === 'CastError') {
    return {
      status: HTTP_STATUS.BAD_REQUEST,
      message: `Invalid ${error.path}: ${error.value}`
    };
  }

  return {
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message: 'Database operation failed'
  };
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Request timeout handler
const timeoutHandler = (timeout = 30000) => {
  return (req, res, next) => {
    req.setTimeout(timeout, () => {
      const error = new AppError('Request timeout', 408);
      next(error);
    });
    next();
  };
};

// Rate limit error handler
const rateLimitErrorHandler = (req, res) => {
  res.status(429).json({
    success: false,
    error: 'Too many requests',
    message: 'Please try again later',
    retryAfter: Math.round(req.rateLimit.resetTime / 1000)
  });
};

// Global error handler
const globalErrorHandler = (error, req, res, next) => {
  console.error('Error details:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  let statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = 'Internal Server Error';
  let details = null;

  // Handle custom app errors
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  }
  // Handle database errors
  else if (
    error.name === 'ValidationError' ||
    error.code === 11000 ||
    error.name === 'CastError'
  ) {
    const dbError = handleDatabaseError(error);
    statusCode = dbError.status;
    message = dbError.message;
    details = dbError.errors || dbError.field;
  }
  // Handle other known errors
  else if (error.status) {
    statusCode = error.status;
    message = error.message;
  }
  // Handle Redis errors
  else if (error.code === 'ECONNREFUSED' && error.address) {
    statusCode = HTTP_STATUS.SERVICE_UNAVAILABLE;
    message = 'Cache service unavailable';
  }
  // Handle MongoDB connection errors
  else if (error.name === 'MongooseError' || error.name === 'MongoError') {
    statusCode = HTTP_STATUS.SERVICE_UNAVAILABLE;
    message = 'Database service unavailable';
  }
  // Handle timeout errors
  else if (error.code === 'TIMEOUT' || error.message.includes('timeout')) {
    statusCode = 408;
    message = 'Request timeout';
  } else if (error.message) {
    message = error.message;
  }

  const response = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    ...(details && { details }),
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      originalError: error.name
    })
  };

  res.status(statusCode).json(response);
};

// 404 handler
const notFoundHandler = (req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    error: 'Route not found',
    message: `The requested route ${req.originalUrl} does not exist`,
    availableRoutes: {
      health: '/health',
      api: '/api',
      oracle: '/api/oracle',
      prices: '/api/prices',
      tokens: '/api/tokens'
    }
  });
};

// Validation error formatter
const formatValidationError = (errors) => {
  return errors.map((error) => ({
    field: error.path || error.param,
    message: error.msg || error.message,
    value: error.value,
    location: error.location
  }));
};

module.exports = {
  AppError,
  handleDatabaseError,
  asyncHandler,
  timeoutHandler,
  rateLimitErrorHandler,
  globalErrorHandler,
  notFoundHandler,
  formatValidationError
};
