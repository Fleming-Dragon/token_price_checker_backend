const express = require("express");
const router = express.Router();

// Import route modules
const tokenRoutes = require("./tokens");
const priceRoutes = require("./prices");
const oracleRoutes = require("./oracle");

// Use route modules
router.use("/tokens", tokenRoutes);
router.use("/prices", priceRoutes);
router.use("/oracle", oracleRoutes);

// API info endpoint
router.get("/", (req, res) => {
  res.json({
    message: "Token Price Checker API with Oracle System",
    version: "2.0.0",
    status: "operational",
    availableEndpoints: {
      "GET /api": "API information",
      "GET /api/tokens": "Token management endpoints",
      "GET /api/prices": "Price data endpoints",
      "GET /api/oracle": "Oracle system endpoints",
    },
    detailedEndpoints: {
      tokens: {
        "GET /api/tokens": "List all tokens",
        "POST /api/tokens": "Add a new token",
        "GET /api/tokens/:id": "Get token by ID",
        "PUT /api/tokens/:id": "Update token",
        "DELETE /api/tokens/:id": "Delete token",
      },
      prices: {
        "GET /api/prices": "Get price data",
        "GET /api/prices/:token": "Get prices for specific token",
      },
      oracle: {
        "GET /api/oracle": "Oracle API information",
        "POST /api/oracle/price": "Get token price at timestamp",
        "POST /api/oracle/schedule": "Schedule data collection",
        "GET /api/oracle/health": "Oracle health check",
      },
    },
    features: [
      "Token price checking",
      "Historical price oracle",
      "Price interpolation",
      "Automated data collection",
      "Redis caching",
      "MongoDB storage",
    ],
  });
});

module.exports = router;
