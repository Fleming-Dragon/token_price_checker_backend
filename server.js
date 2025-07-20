const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

// Import configurations
const databaseConnection = require("./src/config/database");
const redisConnection = require("./src/config/redis");
const alchemyConnection = require("./src/config/alchemy");
const oracleService = require("./src/services/oracleService");

const app = express();
const DEFAULT_PORT = 3000;
const RATE_LIMIT_WINDOW_MINUTES = 15;
const SECONDS_PER_MINUTE = 60;
const MS_PER_SECOND = 1000;
const HTTP_OK = 200;
const HTTP_SERVICE_UNAVAILABLE = 503;
const PORT = process.env.PORT || DEFAULT_PORT;

// Initialize connections
async function initializeConnections() {
  try {
    console.log("🔗 Initializing connections...");

    // Connect to MongoDB
    await databaseConnection.connect();

    // Connect to Redis (optional)
    try {
      await redisConnection.connect();
    } catch (error) {
      console.warn(
        "⚠️ Redis connection failed, continuing without cache:",
        error
      );
    }

    // Initialize Alchemy SDK
    alchemyConnection.initialize();

    // Initialize Oracle Service
    await oracleService.initialize();

    console.log("✅ All connections initialized successfully");
  } catch (error) {
    console.error("❌ Connection initialization failed:", error);
    process.exit(1);
  }
}

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MINUTES * SECONDS_PER_MINUTE * MS_PER_SECOND, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3001",
    credentials: true,
  })
);

// Logging middleware
app.use(morgan("combined"));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Import routes
const apiRoutes = require("./src/routes");
const healthRoutes = require("./src/routes/health");
const {
  globalErrorHandler,
  notFoundHandler,
} = require("./src/middleware/errorHandler");

// Health routes (before rate limiting)
app.use("/health", healthRoutes);

// API routes
app.use("/api", apiRoutes);

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    const health = await oracleService.getHealthStatus();

    res
      .status(health.overall === "healthy" ? HTTP_OK : HTTP_SERVICE_UNAVAILABLE)
      .json({
        status: health.overall,
        message: "Token Price Oracle Backend",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: "2.0.0",
        components: health.components,
      });
  } catch (error) {
    res.status(HTTP_SERVICE_UNAVAILABLE).json({
      status: "unhealthy",
      message: "Health check failed",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Token Price Oracle Backend API",
    version: "2.0.0",
    features: [
      "Historical token price oracle",
      "Price interpolation engine",
      "Automated data collection",
      "Redis caching",
      "MongoDB storage",
      "BullMQ job processing",
      "Alchemy SDK integration",
    ],
    endpoints: {
      health: "/health",
      api: "/api",
      oracle: "/api/oracle",
    },
  });
});

// 404 handler
app.use("*", notFoundHandler);

// Global error handler
app.use(globalErrorHandler); // Graceful shutdown
async function gracefulShutdown() {
  console.log("🔄 Starting graceful shutdown...");

  try {
    // Close Redis connection
    await redisConnection.disconnect();

    // Close database connection
    await databaseConnection.disconnect();

    console.log("✅ Graceful shutdown completed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during shutdown:", error);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// Start server
async function startServer() {
  try {
    // Initialize all connections first
    await initializeConnections();

    // Start the HTTP server
    app.listen(PORT, () => {
      console.log(`🚀 Token Price Oracle Backend is running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`📊 Oracle API: http://localhost:${PORT}/api/oracle`);
      console.log("📚 Documentation: See README.md for API usage");
    });
  } catch (error) {
    console.error("💥 Server startup failed:", error);
    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = app;
