const express = require("express");
const router = express.Router();
const oracleController = require("../../controllers/oracleController");
const {
  validatePriceRequest,
  validateScheduleRequest,
} = require("../../middleware/oracleValidation");

// GET /api/oracle - Oracle API info
router.get("/", (req, res) => {
  res.json({
    message: "Token Price Oracle API",
    version: "2.0.0",
    endpoints: {
      "GET /api/oracle": "Oracle API information",
      "POST /api/oracle/price": "Get token price at specific timestamp",
      "POST /api/oracle/schedule": "Schedule historical price data collection",
      "GET /api/oracle/status/:jobId": "Get job status",
      "GET /api/oracle/jobs": "Get all jobs",
      "DELETE /api/oracle/jobs/:jobId": "Cancel a job",
      "GET /api/oracle/health": "Oracle health check",
    },
    examples: {
      getPriceAtTimestamp: {
        method: "POST",
        url: "/api/oracle/price",
        body: {
          token: "WETH",
          network: "ethereum",
          timestamp: "2024-01-01T00:00:00.000Z",
        },
      },
      scheduleDataCollection: {
        method: "POST",
        url: "/api/oracle/schedule",
        body: {
          token: "WETH",
          network: "ethereum",
        },
      },
    },
  });
});

// POST /api/oracle/price - Get token price at specific timestamp
router.post("/price", validatePriceRequest, oracleController.getTokenPrice);

// POST /api/oracle/schedule - Schedule historical price data collection
router.post(
  "/schedule",
  validateScheduleRequest,
  oracleController.scheduleDataCollection
);

// GET /api/oracle/status/:jobId - Get job status
router.get("/status/:jobId", oracleController.getJobStatus);

// GET /api/oracle/jobs - Get all jobs
router.get("/jobs", oracleController.getAllJobs);

// DELETE /api/oracle/jobs/:jobId - Cancel a job
router.delete("/jobs/:jobId", oracleController.cancelJob);

// GET /api/oracle/health - Oracle health check
router.get("/health", oracleController.healthCheck);

module.exports = router;
