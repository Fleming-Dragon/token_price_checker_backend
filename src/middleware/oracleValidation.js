const Joi = require('joi');

// Ethereum address validation
const ethereumAddressSchema = Joi.string()
  .pattern(/^0x[a-fA-F0-9]{40}$/)
  .required()
  .messages({
    'string.pattern.base': 'Token must be a valid Ethereum address (0x...)'
  });

// Network validation
const networkSchema = Joi.string()
  .valid('ethereum', 'polygon')
  .required()
  .messages({
    'any.only': 'Network must be either "ethereum" or "polygon"'
  });

// Timestamp validation
const timestampSchema = Joi.number()
  .integer()
  .min(1438269960) // Ethereum mainnet launch
  .max(Math.floor(Date.now() / 1000) + 86400) // Allow up to 1 day in future
  .required()
  .messages({
    'number.min':
      'Timestamp must be after Ethereum mainnet launch (July 30, 2015)',
    'number.max': 'Timestamp cannot be more than 1 day in the future'
  });

// Price request validation
const validatePriceRequest = (req, res, next) => {
  const schema = Joi.object({
    token: ethereumAddressSchema,
    network: networkSchema,
    timestamp: timestampSchema
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value
      }))
    });
  }

  // Normalize the validated data
  req.body = {
    token: value.token.toLowerCase(),
    network: value.network.toLowerCase(),
    timestamp: value.timestamp
  };

  next();
};

// Schedule request validation
const validateScheduleRequest = (req, res, next) => {
  const schema = Joi.object({
    token: ethereumAddressSchema,
    network: networkSchema,
    priority: Joi.number().integer().min(1).max(10).default(5).messages({
      'number.min': 'Priority must be between 1 and 10',
      'number.max': 'Priority must be between 1 and 10'
    }),
    startDate: Joi.date().iso().optional().messages({
      'date.format': 'Start date must be in ISO format (YYYY-MM-DD)'
    }),
    endDate: Joi.date().iso().optional().min(Joi.ref('startDate')).messages({
      'date.format': 'End date must be in ISO format (YYYY-MM-DD)',
      'date.min': 'End date must be after start date'
    })
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value
      }))
    });
  }

  // Normalize the validated data
  req.body = {
    token: value.token.toLowerCase(),
    network: value.network.toLowerCase(),
    priority: value.priority,
    startDate: value.startDate,
    endDate: value.endDate
  };

  next();
};

// Job ID validation
const validateJobId = (req, res, next) => {
  const schema = Joi.string().alphanum().required().messages({
    'string.alphanum': 'Job ID must be alphanumeric',
    'any.required': 'Job ID is required'
  });

  const { error, value } = schema.validate(req.params.jobId);

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Invalid job ID',
      message: error.details[0].message
    });
  }

  req.params.jobId = value;
  next();
};

// Query parameters validation for jobs list
const validateJobsQuery = (req, res, next) => {
  const schema = Joi.object({
    status: Joi.string()
      .valid('waiting', 'active', 'completed', 'failed', 'delayed')
      .optional(),
    limit: Joi.number().integer().min(1).max(1000).default(50),
    offset: Joi.number().integer().min(0).default(0),
    token: ethereumAddressSchema.optional(),
    network: networkSchema.optional()
  });

  const { error, value } = schema.validate(req.query);

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Invalid query parameters',
      details: error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value
      }))
    });
  }

  req.query = value;
  next();
};

// Interpolation test validation
const validateInterpolationTest = (req, res, next) => {
  const schema = Joi.object({
    token: ethereumAddressSchema,
    network: networkSchema,
    timestamp: timestampSchema
  });

  const { error, value } = schema.validate(req.query);

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value
      }))
    });
  }

  req.query = {
    token: value.token.toLowerCase(),
    network: value.network.toLowerCase(),
    timestamp: value.timestamp
  };

  next();
};

// Rate limiting validation for bulk operations
const validateBulkOperation = (req, res, next) => {
  const tokensArray = req.body.tokens || [];

  if (tokensArray.length > 100) {
    return res.status(400).json({
      success: false,
      error: 'Too many tokens',
      message: 'Maximum 100 tokens allowed per bulk operation',
      received: tokensArray.length,
      maximum: 100
    });
  }

  next();
};

// Generic parameter validation middleware
const createValidationMiddleware = (schema, source = 'body') => {
  return (req, res, next) => {
    const data =
      source === 'query'
        ? req.query
        : source === 'params'
          ? req.params
          : req.body;

    const { error, value } = schema.validate(data);

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context.value
        }))
      });
    }

    // Update the request object with validated data
    if (source === 'query') {
      req.query = value;
    } else if (source === 'params') {
      req.params = value;
    } else {
      req.body = value;
    }

    next();
  };
};

module.exports = {
  validatePriceRequest,
  validateScheduleRequest,
  validateJobId,
  validateJobsQuery,
  validateInterpolationTest,
  validateBulkOperation,
  createValidationMiddleware,

  // Export schemas for reuse
  schemas: {
    ethereumAddress: ethereumAddressSchema,
    network: networkSchema,
    timestamp: timestampSchema
  }
};
