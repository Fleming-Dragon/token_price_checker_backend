const express = require('express');
const router = express.Router();
const oracleController = require('../../controllers/oracleController');
const {
  validatePriceRequest,
  validateScheduleRequest
} = require('../../middleware/oracleValidation');

// POST /api/oracle/price - Get token price at specific timestamp
router.post('/price', validatePriceRequest, oracleController.getTokenPrice);

// POST /api/oracle/schedule - Schedule historical price data collection
router.post(
  '/schedule',
  validateScheduleRequest,
  oracleController.scheduleDataCollection
);

// GET /api/oracle/status/:jobId - Get job status
router.get('/status/:jobId', oracleController.getJobStatus);

// GET /api/oracle/jobs - Get all jobs
router.get('/jobs', oracleController.getAllJobs);

// DELETE /api/oracle/jobs/:jobId - Cancel a job
router.delete('/jobs/:jobId', oracleController.cancelJob);

// GET /api/oracle/health - Oracle health check
router.get('/health', oracleController.healthCheck);

module.exports = router;
