const path = require('path');
const fs = require('fs');

class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.logDir = process.env.LOG_DIR || path.join(process.cwd(), 'logs');
    this.enableFileLogging = process.env.ENABLE_FILE_LOGGING === 'true';

    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };

    // Create logs directory if it doesn't exist
    if (this.enableFileLogging && !fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  shouldLog(level) {
    return this.levels[level] <= this.levels[this.logLevel];
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...meta
    };

    if (process.env.NODE_ENV === 'development') {
      return JSON.stringify(logEntry, null, 2);
    }
    return JSON.stringify(logEntry);
  }

  writeToFile(level, formattedMessage) {
    if (!this.enableFileLogging) return;

    const today = new Date().toISOString().split('T')[0];
    const logFile = path.join(this.logDir, `${today}-${level}.log`);

    fs.appendFileSync(logFile, formattedMessage + '\n');
  }

  log(level, message, meta = {}) {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, meta);

    // Console output
    switch (level) {
    case 'error':
      console.error(formattedMessage);
      break;
    case 'warn':
      console.warn(formattedMessage);
      break;
    case 'debug':
      if (process.env.NODE_ENV === 'development') {
        console.log(formattedMessage);
      }
      break;
    default:
      console.log(formattedMessage);
    }

    // File output
    this.writeToFile(level, formattedMessage);
  }

  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  // Oracle specific logging methods
  priceQuery(token, network, timestamp, source, price) {
    this.info('Price query executed', {
      token,
      network,
      timestamp,
      source,
      price,
      type: 'price_query'
    });
  }

  jobScheduled(jobId, token, network, timestampCount) {
    this.info('Price fetching job scheduled', {
      jobId,
      token,
      network,
      timestampCount,
      type: 'job_scheduled'
    });
  }

  jobCompleted(jobId, processedCount, failedCount, duration) {
    this.info('Price fetching job completed', {
      jobId,
      processedCount,
      failedCount,
      duration,
      type: 'job_completed'
    });
  }

  jobFailed(jobId, error, token, network) {
    this.error('Price fetching job failed', {
      jobId,
      error: error.message,
      token,
      network,
      type: 'job_failed'
    });
  }

  interpolation(
    token,
    network,
    timestamp,
    beforePrice,
    afterPrice,
    interpolatedPrice,
    confidence
  ) {
    this.debug('Price interpolation performed', {
      token,
      network,
      timestamp,
      beforePrice,
      afterPrice,
      interpolatedPrice,
      confidence,
      type: 'interpolation'
    });
  }

  cacheHit(key, type) {
    this.debug('Cache hit', {
      key,
      type,
      event: 'cache_hit'
    });
  }

  cacheMiss(key, type) {
    this.debug('Cache miss', {
      key,
      type,
      event: 'cache_miss'
    });
  }

  apiRequest(req, responseTime, statusCode) {
    this.info('API request', {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      responseTime,
      statusCode,
      type: 'api_request'
    });
  }

  databaseOperation(operation, collection, duration, success = true) {
    this.debug('Database operation', {
      operation,
      collection,
      duration,
      success,
      type: 'database_operation'
    });
  }

  workerHealth(workerId, memoryUsage, cpuUsage, activeJobs) {
    this.debug('Worker health check', {
      workerId,
      memoryUsage,
      cpuUsage,
      activeJobs,
      type: 'worker_health'
    });
  }

  systemMetrics(metrics) {
    this.info('System metrics', {
      ...metrics,
      type: 'system_metrics'
    });
  }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;
