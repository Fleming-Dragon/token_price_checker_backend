#!/usr/bin/env node

require('dotenv').config();

const databaseConnection = require('../config/database');
const redisConnection = require('../config/redis');
const alchemyConnection = require('../config/alchemy');
const queueService = require('../services/queueService');

class PriceWorker {
  constructor() {
    this.worker = null;
    this.isShuttingDown = false;
  }

  async start() {
    try {
      console.log('🚀 Starting Price Oracle Worker...');

      // Initialize connections
      await this.initializeConnections();

      // Create and start worker
      this.worker = queueService.createWorker();

      // Handle graceful shutdown
      this.setupGracefulShutdown();

      console.log(
        '✅ Price Oracle Worker is running and ready to process jobs'
      );
      console.log('📊 Worker configuration:');
      console.log(`   - Concurrency: ${process.env.WORKER_CONCURRENCY || 5}`);
      console.log(
        `   - Rate limit: ${
          process.env.ALCHEMY_RATE_LIMIT || 100
        } requests/minute`
      );
      console.log(`   - Batch size: ${process.env.BATCH_SIZE || 10}`);
      console.log(`   - Retry attempts: ${process.env.RETRY_ATTEMPTS || 3}`);
    } catch (error) {
      console.error('❌ Failed to start worker:', error);
      process.exit(1);
    }
  }

  async initializeConnections() {
    try {
      // Initialize database connection
      console.log('🔗 Connecting to MongoDB...');
      await databaseConnection.connect();

      // Initialize Redis connection
      console.log('🔗 Connecting to Redis...');
      await redisConnection.connect();

      // Initialize Alchemy SDK
      console.log('🔗 Initializing Alchemy SDK...');
      alchemyConnection.initialize();

      // Initialize queue service
      console.log('🔗 Initializing Queue Service...');
      await queueService.initialize();

      console.log('✅ All connections initialized successfully');
    } catch (error) {
      console.error('❌ Connection initialization failed:', error);
      throw error;
    }
  }

  setupGracefulShutdown() {
    const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

    signals.forEach((signal) => {
      process.on(signal, async() => {
        if (this.isShuttingDown) {
          console.log('🔄 Shutdown already in progress...');
          return;
        }

        this.isShuttingDown = true;
        console.log(`\n📡 Received ${signal}, starting graceful shutdown...`);

        try {
          // Stop accepting new jobs and finish current ones
          if (this.worker) {
            console.log('⏹️ Stopping worker...');
            await this.worker.close();
          }

          // Close queue service
          console.log('📋 Closing queue service...');
          await queueService.shutdown();

          // Close Redis connection
          console.log('🔌 Closing Redis connection...');
          await redisConnection.disconnect();

          // Close database connection
          console.log('🔌 Closing database connection...');
          await databaseConnection.disconnect();

          console.log('✅ Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }

  // Worker health monitoring
  async monitorHealth() {
    setInterval(async() => {
      try {
        const health = await this.getWorkerHealth();

        if (health.status !== 'healthy') {
          console.warn('⚠️ Worker health check failed:', health);
        }
      } catch (error) {
        console.error('❌ Health monitoring error:', error);
      }
    }, 30000); // Check every 30 seconds
  }

  async getWorkerHealth() {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        connections: {}
      };

      // Check database connection
      const dbStatus = databaseConnection.getConnectionStatus();
      health.connections.database = dbStatus.isConnected
        ? 'healthy'
        : 'unhealthy';

      // Check Redis connection
      const redisStatus = redisConnection.getConnectionStatus();
      health.connections.redis = redisStatus.isConnected
        ? 'healthy'
        : 'unhealthy';

      // Check queue health
      const queueHealthy = await queueService.getHealthStatus();
      health.connections.queue = queueHealthy ? 'healthy' : 'unhealthy';

      // Check Alchemy connection
      const alchemyStatus = alchemyConnection.getConnectionStatus();
      health.connections.alchemy = alchemyStatus.isConfigured
        ? 'healthy'
        : 'degraded';

      // Overall health
      const allHealthy = Object.values(health.connections).every(
        (status) => status === 'healthy' || status === 'degraded'
      );

      if (!allHealthy) {
        health.status = 'unhealthy';
      }

      return health;
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Performance metrics
  getPerformanceMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        external: Math.round(memUsage.external / 1024 / 1024) // MB
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      }
    };
  }

  // Log performance metrics periodically
  logMetrics() {
    setInterval(() => {
      const metrics = this.getPerformanceMetrics();
      console.log('📊 Worker Metrics:', {
        uptime: `${Math.round(metrics.uptime / 60)}m`,
        memory: `${metrics.memory.heapUsed}MB`,
        timestamp: metrics.timestamp
      });
    }, 300000); // Every 5 minutes
  }
}

// Start the worker if this file is run directly
if (require.main === module) {
  const worker = new PriceWorker();

  // Start health monitoring
  worker.monitorHealth();

  // Start metrics logging
  worker.logMetrics();

  // Start the worker
  worker.start().catch((error) => {
    console.error('💥 Worker startup failed:', error);
    process.exit(1);
  });
}

module.exports = PriceWorker;
