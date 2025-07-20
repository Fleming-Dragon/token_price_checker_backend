const express = require('express');
const router = express.Router();
const redis = require('../config/redis');
const mongoose = require('mongoose');
const { Queue } = require('bullmq');
const logger = require('../utils/logger');
const { HTTP_STATUS } = require('../constants');

// Health check endpoint
router.get('/', async(req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {},
      system: {}
    };

    // Check MongoDB connection
    try {
      if (mongoose.connection.readyState === 1) {
        const dbStats = await mongoose.connection.db.stats();
        health.services.mongodb = {
          status: 'connected',
          database: mongoose.connection.name,
          collections: dbStats.collections,
          dataSize: dbStats.dataSize,
          indexSize: dbStats.indexSize
        };
      } else {
        health.services.mongodb = {
          status: 'disconnected',
          readyState: mongoose.connection.readyState
        };
        health.status = 'degraded';
      }
    } catch (error) {
      health.services.mongodb = {
        status: 'error',
        error: error.message
      };
      health.status = 'unhealthy';
    }

    // Check Redis connection
    try {
      const redisInfo = await redis.ping();
      if (redisInfo === 'PONG') {
        const redisMemory = await redis.memory('usage');
        health.services.redis = {
          status: 'connected',
          ping: redisInfo,
          memoryUsage: redisMemory
        };
      } else {
        health.services.redis = {
          status: 'disconnected'
        };
        health.status = 'degraded';
      }
    } catch (error) {
      health.services.redis = {
        status: 'error',
        error: error.message
      };
      health.status = 'degraded';
    }

    // Check BullMQ queue
    try {
      const priceQueue = new Queue('price-fetching', {
        connection: redis
      });

      const [waiting, active, completed, failed] = await Promise.all([
        priceQueue.getWaiting(),
        priceQueue.getActive(),
        priceQueue.getCompleted(),
        priceQueue.getFailed()
      ]);

      health.services.bullmq = {
        status: 'connected',
        queues: {
          'price-fetching': {
            waiting: waiting.length,
            active: active.length,
            completed: completed.length,
            failed: failed.length
          }
        }
      };
    } catch (error) {
      health.services.bullmq = {
        status: 'error',
        error: error.message
      };
      health.status = 'degraded';
    }

    // System metrics
    const memUsage = process.memoryUsage();
    health.system = {
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
        external: Math.round(memUsage.external / 1024 / 1024) + ' MB'
      },
      cpu: {
        usage: process.cpuUsage(),
        loadAverage:
          process.platform !== 'win32'
            ? require('os').loadavg()
            : 'N/A (Windows)'
      },
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };

    const statusCode =
      health.status === 'healthy'
        ? HTTP_STATUS.OK
        : health.status === 'degraded'
          ? HTTP_STATUS.OK
          : HTTP_STATUS.SERVICE_UNAVAILABLE;

    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Detailed health check with more metrics
router.get('/detailed', async(req, res) => {
  try {
    const TokenPrice = require('../models/TokenPrice');
    const Token = require('../models/Token');

    // Get database statistics
    const [priceCount, tokenCount, recentPrices] = await Promise.all([
      TokenPrice.countDocuments(),
      Token.countDocuments(),
      TokenPrice.find().sort({ timestamp: -1 }).limit(5)
    ]);

    // Get Redis info
    const redisInfo = await redis.info();

    const detailedHealth = {
      timestamp: new Date().toISOString(),
      database: {
        collections: {
          tokenPrices: priceCount,
          tokens: tokenCount
        },
        recentActivity: recentPrices.map((price) => ({
          token: price.token,
          network: price.network,
          price: price.price,
          timestamp: price.timestamp,
          source: price.source
        }))
      },
      cache: {
        info: redisInfo,
        keyCount: await redis.dbsize()
      },
      performance: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      }
    };

    res.json(detailedHealth);
  } catch (error) {
    logger.error('Detailed health check failed', { error: error.message });
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to generate detailed health report',
      message: error.message
    });
  }
});

// Readiness probe
router.get('/ready', async(req, res) => {
  try {
    // Check critical services
    const mongoReady = mongoose.connection.readyState === 1;
    const redisReady = (await redis.ping()) === 'PONG';

    if (mongoReady && redisReady) {
      res.status(HTTP_STATUS.OK).json({
        ready: true,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
        ready: false,
        services: {
          mongodb: mongoReady,
          redis: redisReady
        },
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
      ready: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Liveness probe
router.get('/live', (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    alive: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;
