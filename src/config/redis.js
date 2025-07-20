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
      // Check if we have a Redis URL (for hosted services with SSL)
      const redisUrl = process.env.REDIS_URL;

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
      });

      this.client.on("close", () => {
        console.log("🔌 Redis connection closed");
        this.isConnected = false;
      });

      this.client.on("reconnecting", () => {
        console.log("🔄 Redis reconnecting...");
      });

      // Connect to Redis
      await this.client.connect();

      return this.client;
    } catch (error) {
      console.error("❌ Redis connection failed:", error);
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
      throw new Error("Redis client not connected");
    }

    const serializedValue = JSON.stringify(value);

    if (ttl) {
      return await this.client.setex(key, ttl, serializedValue);
    } else {
      return await this.client.set(key, serializedValue);
    }
  }

  async get(key) {
    if (!this.client || !this.isConnected) {
      throw new Error("Redis client not connected");
    }

    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async del(key) {
    if (!this.client || !this.isConnected) {
      throw new Error("Redis client not connected");
    }

    return await this.client.del(key);
  }

  async exists(key) {
    if (!this.client || !this.isConnected) {
      throw new Error("Redis client not connected");
    }

    return await this.client.exists(key);
  }

  async flushall() {
    if (!this.client || !this.isConnected) {
      throw new Error("Redis client not connected");
    }

    return await this.client.flushall();
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
