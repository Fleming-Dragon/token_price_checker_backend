const { Queue, Worker } = require("bullmq");
const Redis = require("ioredis");
const pRetry = require("p-retry");

class QueueService {
  constructor() {
    this.connection = null;
    this.priceQueue = null;
    this.worker = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Create Redis connection for BullMQ
      const redisUrl = process.env.REDIS_URL;

      if (redisUrl) {
        // Use the full URL for hosted services (supports SSL)
        this.connection = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          retryDelayOnFailover: 100,
          // Enable TLS for rediss:// URLs
          tls: redisUrl.startsWith("rediss://") ? {} : undefined,
        });
      } else {
        // Fallback to individual config parameters for local development
        this.connection = new Redis({
          host: process.env.BULLMQ_REDIS_HOST || "localhost",
          port: parseInt(process.env.BULLMQ_REDIS_PORT) || 6379,
          password: process.env.BULLMQ_REDIS_PASSWORD || undefined,
          maxRetriesPerRequest: 3,
          retryDelayOnFailover: 100,
        });
      }

      // Create price collection queue
      this.priceQueue = new Queue("price-collection", {
        connection: this.connection,
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2000,
          },
        },
      });

      this.isInitialized = true;
      console.log("🎯 Queue service initialized successfully");
    } catch (error) {
      console.error("❌ Queue service initialization failed:", error);
      throw error;
    }
  }

  // Create worker (should be called in separate process)
  createWorker() {
    if (!this.connection) {
      throw new Error("Queue service not initialized");
    }

    this.worker = new Worker(
      "price-collection",
      async (job) => {
        return await this.processPriceCollectionJob(job);
      },
      {
        connection: this.connection,
        concurrency: parseInt(process.env.WORKER_CONCURRENCY) || 5,
        limiter: {
          max: parseInt(process.env.ALCHEMY_RATE_LIMIT) || 100,
          duration: 60000, // per minute
        },
      }
    );

    // Worker event handlers
    this.worker.on("completed", (job) => {
      console.log(`✅ Job ${job.id} completed successfully`);
    });

    this.worker.on("failed", (job, err) => {
      console.error(`❌ Job ${job.id} failed:`, err);
    });

    this.worker.on("progress", (job, progress) => {
      console.log(`📊 Job ${job.id} progress: ${progress}%`);
    });

    console.log("👷 Worker created and listening for jobs");
    return this.worker;
  }

  // Add price collection job to queue
  async addPriceCollectionJob(data) {
    if (!this.priceQueue) {
      throw new Error("Queue not initialized");
    }

    const job = await this.priceQueue.add("collect-historical-prices", data, {
      priority: 1,
      delay: 1000, // Start after 1 second
    });

    console.log(
      `📋 Added price collection job ${job.id} for ${data.token} on ${data.network}`
    );
    return job;
  }

  // Process price collection job
  async processPriceCollectionJob(job) {
    const { token, network, timestamps, creationTimestamp } = job.data;
    const batchSize = parseInt(process.env.BATCH_SIZE) || 10;

    console.log(
      `🔄 Processing job ${job.id}: ${token} on ${network} (${timestamps.length} timestamps)`
    );

    let processed = 0;
    let successful = 0;
    let failed = 0;

    // Process timestamps in batches
    for (let i = 0; i < timestamps.length; i += batchSize) {
      const batch = timestamps.slice(i, i + batchSize);

      try {
        await this.processBatch(token, network, batch, job);
        successful += batch.length;

        // Update job progress
        processed += batch.length;
        const progress = Math.round((processed / timestamps.length) * 100);
        await job.updateProgress(progress);

        // Delay between batches to respect rate limits
        if (i + batchSize < timestamps.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error("❌ Batch processing failed:", error);
        failed += batch.length;
      }
    }

    const result = {
      token,
      network,
      totalTimestamps: timestamps.length,
      successful,
      failed,
      completedAt: new Date().toISOString(),
    };

    console.log(`✅ Job ${job.id} completed:`, result);
    return result;
  }

  // Process a batch of timestamps
  async processBatch(token, network, timestamps, job) {
    const TokenPrice = require("../models/TokenPrice");
    const alchemyConnection = require("../config/alchemy");

    for (const timestamp of timestamps) {
      try {
        // Check if price already exists
        const existingPrice = await TokenPrice.findOne({
          token: token.toLowerCase(),
          network: network.toLowerCase(),
          timestamp: timestamp,
        });

        if (existingPrice) {
          console.log(`⏭️ Price already exists for ${token} at ${timestamp}`);
          continue;
        }

        // Fetch price with retry logic
        const priceData = await pRetry(
          async () => {
            return await this.fetchHistoricalPrice(token, network, timestamp);
          },
          {
            retries: parseInt(process.env.RETRY_ATTEMPTS) || 3,
            factor: 2,
            minTimeout: parseInt(process.env.RETRY_DELAY) || 1000,
            onFailedAttempt: (error) => {
              console.warn(
                `⚠️ Attempt ${error.attemptNumber} failed for ${token} at ${timestamp}: ${error.message}`
              );
            },
          }
        );

        if (priceData) {
          // Save to database
          const priceRecord = new TokenPrice({
            token: token.toLowerCase(),
            network: network.toLowerCase(),
            date: new Date(timestamp * 1000),
            timestamp: timestamp,
            price: priceData.price,
            priceUsd: priceData.priceUsd,
            volume24h: priceData.volume24h,
            marketCap: priceData.marketCap,
            source: "alchemy",
            confidence: 1,
            metadata: priceData.metadata,
          });

          await priceRecord.save();
          console.log(
            `💾 Saved price for ${token} at ${timestamp}: $${priceData.price}`
          );
        }
      } catch (error) {
        console.error(`❌ Failed to process ${token} at ${timestamp}:`, error);
        // Continue with next timestamp
      }
    }
  }

  // Fetch historical price (placeholder - integrate with actual price sources)
  async fetchHistoricalPrice(token, network, timestamp) {
    try {
      // This would integrate with:
      // - DEX price feeds (Uniswap, SushiSwap)
      // - External APIs (CoinGecko, CoinMarketCap with historical endpoints)
      // - Oracle networks (Chainlink)

      console.warn(
        `⚠️ Historical price fetching not implemented for ${token} at ${timestamp}`
      );

      // Return mock data for now
      return {
        price: Math.random() * 1000, // Mock price
        priceUsd: Math.random() * 1000,
        volume24h: Math.random() * 1000000,
        marketCap: Math.random() * 1000000000,
        metadata: {
          source: "mock",
          timestamp: timestamp,
        },
      };
    } catch (error) {
      console.error("Error fetching historical price:", error);
      throw error;
    }
  }

  // Get job status
  async getJobStatus(jobId) {
    if (!this.priceQueue) {
      throw new Error("Queue not initialized");
    }

    try {
      const job = await this.priceQueue.getJob(jobId);

      if (!job) {
        return null;
      }

      return {
        id: job.id,
        name: job.name,
        data: job.data,
        progress: job.progress,
        state: await job.getState(),
        createdAt: new Date(job.timestamp).toISOString(),
        processedOn: job.processedOn
          ? new Date(job.processedOn).toISOString()
          : null,
        finishedOn: job.finishedOn
          ? new Date(job.finishedOn).toISOString()
          : null,
        failedReason: job.failedReason,
        returnvalue: job.returnvalue,
      };
    } catch (error) {
      console.error("Error getting job status:", error);
      throw error;
    }
  }

  // Get all jobs
  async getAllJobs(options = {}) {
    if (!this.priceQueue) {
      throw new Error("Queue not initialized");
    }

    try {
      const { status, limit = 50, offset = 0 } = options;

      let jobs;
      if (status) {
        jobs = await this.priceQueue.getJobs(
          [status],
          offset,
          offset + limit - 1
        );
      } else {
        jobs = await this.priceQueue.getJobs(
          ["waiting", "active", "completed", "failed"],
          offset,
          offset + limit - 1
        );
      }

      return jobs.map((job) => ({
        id: job.id,
        name: job.name,
        data: job.data,
        progress: job.progress,
        state: job.opts.delay ? "delayed" : "waiting", // Simplified state
        createdAt: new Date(job.timestamp).toISOString(),
      }));
    } catch (error) {
      console.error("Error getting all jobs:", error);
      throw error;
    }
  }

  // Cancel job
  async cancelJob(jobId) {
    if (!this.priceQueue) {
      throw new Error("Queue not initialized");
    }

    try {
      const job = await this.priceQueue.getJob(jobId);

      if (!job) {
        return false;
      }

      await job.remove();
      return true;
    } catch (error) {
      console.error("Error cancelling job:", error);
      throw error;
    }
  }

  // Get queue statistics
  async getQueueStats() {
    if (!this.priceQueue) {
      return { error: "Queue not initialized" };
    }

    try {
      const waiting = await this.priceQueue.getWaiting();
      const active = await this.priceQueue.getActive();
      const completed = await this.priceQueue.getCompleted();
      const failed = await this.priceQueue.getFailed();

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        total:
          waiting.length + active.length + completed.length + failed.length,
      };
    } catch (error) {
      console.error("Error getting queue stats:", error);
      return { error: error.message };
    }
  }

  // Health check
  async getHealthStatus() {
    try {
      if (!this.connection || !this.priceQueue) {
        return false;
      }

      // Test Redis connection
      await this.connection.ping();

      // Test queue operations
      const stats = await this.getQueueStats();

      return !stats.error;
    } catch (error) {
      console.error("Queue health check failed:", error);
      return false;
    }
  }

  // Clean up old jobs
  async cleanupJobs() {
    if (!this.priceQueue) {
      return;
    }

    try {
      await this.priceQueue.clean(24 * 60 * 60 * 1000, 1000, "completed"); // Clean completed jobs older than 24 hours
      await this.priceQueue.clean(7 * 24 * 60 * 60 * 1000, 100, "failed"); // Clean failed jobs older than 7 days
      console.log("🧹 Queue cleanup completed");
    } catch (error) {
      console.error("Error during queue cleanup:", error);
    }
  }

  // Graceful shutdown
  async shutdown() {
    try {
      if (this.worker) {
        await this.worker.close();
        console.log("👷 Worker shut down gracefully");
      }

      if (this.priceQueue) {
        await this.priceQueue.close();
        console.log("📋 Queue closed gracefully");
      }

      if (this.connection) {
        await this.connection.quit();
        console.log("🔌 Queue Redis connection closed");
      }
    } catch (error) {
      console.error("Error during queue shutdown:", error);
    }
  }
}

module.exports = new QueueService();
