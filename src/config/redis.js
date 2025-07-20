const Redis = require("ioredis");

class RedisConnection {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected && this.client) {
      console.log("🔗 Redis already connected");
      return this.client;
    }

    try {
      // Check if Redis is available or required
      const redisUrl = process.env.REDIS_URL;
      const redisRequired = process.env.REDIS_REQUIRED !== "false";

      // If no Redis URL and Redis is not required, skip Redis setup
      if (!redisUrl && !redisRequired) {
        console.log(
          "⚠️ Redis not configured - running without cache (performance may be impacted)"
        );
        this.client = null;
        this.isConnected = false;
        return null;
      }

      let redisConfig;

      if (redisUrl) {
        // Use the full URL for hosted services (supports SSL)
        redisConfig = {
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          keepAlive: 30000,
          connectTimeout: 10000,
          commandTimeout: 5000,
          // Enable TLS for rediss:// URLs
          tls: redisUrl.startsWith("rediss://") ? {} : undefined,
        };
        this.client = new Redis(redisUrl, redisConfig);
      } else {
        // Fallback to individual config parameters for local development
        redisConfig = {
          host: process.env.REDIS_HOST || "localhost",
          port: parseInt(process.env.REDIS_PORT) || 6379,
          password: process.env.REDIS_PASSWORD || undefined,
          db: parseInt(process.env.REDIS_DB) || 0,
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          keepAlive: 30000,
          connectTimeout: 10000,
          commandTimeout: 5000,
        };
        this.client = new Redis(redisConfig);
      }

      // Connection events
      this.client.on("connect", () => {
        console.log("🎯 Redis connected successfully");
        this.isConnected = true;
      });

      this.client.on("error", (error) => {
        console.error("❌ Redis connection error:", error);
        this.isConnected = false;
        // Don't crash the app if Redis is optional
        if (!redisRequired) {
          console.warn("⚠️ Redis is optional - continuing without cache");
        }
      });

      this.client.on("close", () => {
        console.log("🔌 Redis connection closed");
        this.isConnected = false;
      });

      this.client.on("reconnecting", () => {
        console.log("🔄 Redis reconnecting...");
      });

      // Connect to Redis with error handling
      try {
        await this.client.connect();
      } catch (error) {
        console.error("❌ Redis connection failed:", error);
        if (!redisRequired) {
          console.warn(
            "⚠️ Running without Redis cache - performance may be impacted"
          );
          this.client = null;
          this.isConnected = false;
          return null;
        } else {
          throw error;
        }
      }

      return this.client;
    } catch (error) {
      console.error("❌ Redis setup failed:", error);
      // If Redis is optional, continue without it
      if (process.env.REDIS_REQUIRED !== "true") {
        console.warn("⚠️ Continuing without Redis cache");
        this.client = null;
        this.isConnected = false;
        return null;
      }
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      console.log("🔌 Redis disconnected gracefully");
    }
  }

  getClient() {
    return this.client;
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      status: this.client ? this.client.status : "not initialized",
    };
  }

  // Cache helper methods
  async set(key, value, ttl = null) {
    if (!this.client || !this.isConnected) {
      console.warn("⚠️ Redis not available, skipping cache set");
      return null;
    }

    try {
      const serializedValue = JSON.stringify(value);

      if (ttl) {
        return this.client.setex(key, ttl, serializedValue);
      } else {
        return this.client.set(key, serializedValue);
      }
    } catch (error) {
      console.warn("⚠️ Redis set operation failed:", error);
      return null;
    }
  }

  async get(key) {
    if (!this.client || !this.isConnected) {
      console.warn("⚠️ Redis not available, skipping cache get");
      return null;
    }

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.warn("⚠️ Redis get operation failed:", error);
      return null;
    }
  }

  async del(key) {
    if (!this.client || !this.isConnected) {
      console.warn("⚠️ Redis not available, skipping cache delete");
      return null;
    }

    try {
      return this.client.del(key);
    } catch (error) {
      console.warn("⚠️ Redis delete operation failed:", error);
      return null;
    }
  }

  async exists(key) {
    if (!this.client || !this.isConnected) {
      console.warn("⚠️ Redis not available, skipping cache exists check");
      return false;
    }

    try {
      return this.client.exists(key);
    } catch (error) {
      console.warn("⚠️ Redis exists operation failed:", error);
      return false;
    }
  }

  async flushall() {
    if (!this.client || !this.isConnected) {
      console.warn("⚠️ Redis not available, skipping cache flush");
      return null;
    }

    try {
      return this.client.flushall();
    } catch (error) {
      console.warn("⚠️ Redis flush operation failed:", error);
      return null;
    }
  }

  // Generate cache keys
  generatePriceKey(token, network, timestamp) {
    return `price:${token}:${network}:${timestamp}`;
  }

  generateTokenKey(token, network) {
    return `token:${token}:${network}`;
  }
}

module.exports = new RedisConnection();
