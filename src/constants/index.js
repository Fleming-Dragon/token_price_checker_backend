/**
 * Application Constants
 * Centralized location for all magic numbers and configuration values
 */

// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// Server Configuration
const SERVER_CONFIG = {
  DEFAULT_PORT: 3000,
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100
  }
};

// Database Configuration
const DATABASE_CONFIG = {
  DEFAULT_REDIS_PORT: 6379,
  DEFAULT_PAGINATION_LIMIT: 100,
  MAX_BULK_TOKENS: 100,
  SEARCH_MIN_LENGTH: 2,
  DEFAULT_SEARCH_LIMIT: 10
};

// Time Constants (in milliseconds)
const TIME_CONSTANTS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000
};

// Cache TTL (Time To Live) values
const CACHE_TTL = {
  PRICE_DATA: 5 * TIME_CONSTANTS.MINUTE,
  TOKEN_DATA: 30 * TIME_CONSTANTS.MINUTE,
  HISTORICAL_DATA: 2 * TIME_CONSTANTS.HOUR
};

// Oracle Service Configuration
const ORACLE_CONFIG = {
  DEFAULT_CACHE_TTL: 300, // 5 minutes in seconds
  MAX_HISTORICAL_DAYS: 365,
  MIN_UNIX_TIMESTAMP: 1438269960, // Ethereum genesis block timestamp
  MAX_CONFIDENCE_SCORE: 1.0,
  MIN_CONFIDENCE_SCORE: 0.1,
  INTERPOLATION: {
    MAX_TIME_GAP_HOURS: 48,
    HIGH_CONFIDENCE_THRESHOLD: 0.8,
    MEDIUM_CONFIDENCE_THRESHOLD: 0.5,
    TIME_DECAY_FACTOR: 0.1,
    NEARBY_WEIGHT: 0.7,
    TREND_WEIGHT: 0.2,
    BASE_CONFIDENCE: 0.85,
    MAX_DISTANCE_HOURS: 8
  }
};

// Queue Configuration
const QUEUE_CONFIG = {
  MAX_RETRIES: 5,
  RETRY_DELAY: 100, // milliseconds
  BATCH_SIZE: 10,
  CONCURRENCY: 3,
  REMOVE_ON_COMPLETE: 50,
  REMOVE_ON_FAIL: 100,
  DEFAULT_JOB_DELAY: 1000,
  HEALTH_CHECK_INTERVAL: 30000 // 30 seconds
};

// Worker Configuration
const WORKER_CONFIG = {
  HEALTH_CHECK_INTERVAL: 300000, // 5 minutes
  MEMORY_THRESHOLD_MB: 1024,
  CPU_THRESHOLD_PERCENT: 80,
  STATS_SAMPLE_SIZE: 60, // samples for moving average
  GRACEFUL_SHUTDOWN_TIMEOUT: 10000 // 10 seconds
};

// API Validation Constants
const VALIDATION_LIMITS = {
  MAX_TOKENS_PER_REQUEST: 50,
  MAX_CHART_POINTS: 1000,
  MIN_QUERY_LENGTH: 2,
  MAX_QUERY_LENGTH: 100,
  DEFAULT_CHART_POINTS: 100
};

// Network Constants
const NETWORKS = {
  ETHEREUM: 'ethereum',
  POLYGON: 'polygon',
  BSC: 'bsc',
  AVALANCHE: 'avalanche'
};

// Test Configuration
const TEST_CONFIG = {
  TIMEOUT: {
    SHORT: 15000,
    MEDIUM: 20000,
    LONG: 30000
  }
};

module.exports = {
  HTTP_STATUS,
  SERVER_CONFIG,
  DATABASE_CONFIG,
  TIME_CONSTANTS,
  CACHE_TTL,
  ORACLE_CONFIG,
  QUEUE_CONFIG,
  WORKER_CONFIG,
  VALIDATION_LIMITS,
  NETWORKS,
  TEST_CONFIG
};
