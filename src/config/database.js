const mongoose = require("mongoose");

class DatabaseConnection {
  constructor() {
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) {
      console.log("🔗 MongoDB already connected");
      return;
    }

    try {
      const mongoUri =
        process.env.MONGODB_URI ||
        "mongodb://localhost:27017/token_price_oracle";

      await mongoose.connect(mongoUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4, // Use IPv4, skip trying IPv6
      });

      this.isConnected = true;
      console.log("🎯 MongoDB connected successfully");

      // Handle connection events
      mongoose.connection.on("error", (error) => {
        console.error("❌ MongoDB connection error:", error);
        this.isConnected = false;
      });

      mongoose.connection.on("disconnected", () => {
        console.log("🔌 MongoDB disconnected");
        this.isConnected = false;
      });

      mongoose.connection.on("reconnected", () => {
        console.log("🔄 MongoDB reconnected");
        this.isConnected = true;
      });

      // Graceful shutdown
      process.on("SIGINT", async () => {
        await this.disconnect();
        process.exit(0);
      });
    } catch (error) {
      console.error("❌ MongoDB connection failed:", error);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect() {
    if (this.isConnected) {
      await mongoose.connection.close();
      this.isConnected = false;
      console.log("🔌 MongoDB disconnected gracefully");
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
    };
  }
}

module.exports = new DatabaseConnection();
