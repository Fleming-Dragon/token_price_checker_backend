const oracleService = require('../services/oracleService');
const interpolationService = require('../services/interpolationService');
const queueService = require('../services/queueService');

class OracleController {
  // POST /api/oracle/price
  async getTokenPrice(req, res) {
    try {
      const { token, network, timestamp } = req.body;

      console.log(`🔍 Price request: ${token} on ${network} at ${timestamp}`);

      const result = await oracleService.getTokenPriceAtTimestamp(
        token,
        network,
        timestamp
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error in getTokenPrice:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get token price',
        message: error.message
      });
    }
  }

  // POST /api/oracle/schedule
  async scheduleDataCollection(req, res) {
    try {
      const { token, network } = req.body;

      console.log(`📅 Scheduling data collection for ${token} on ${network}`);

      const job = await oracleService.scheduleHistoricalDataCollection(
        token,
        network
      );

      res.json({
        success: true,
        data: {
          jobId: job.id,
          token,
          network,
          status: 'scheduled',
          message: 'Data collection job has been scheduled'
        }
      });
    } catch (error) {
      console.error('Error in scheduleDataCollection:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to schedule data collection',
        message: error.message
      });
    }
  }

  // GET /api/oracle/status/:jobId
  async getJobStatus(req, res) {
    try {
      const { jobId } = req.params;

      const status = await queueService.getJobStatus(jobId);

      if (!status) {
        return res.status(404).json({
          success: false,
          error: 'Job not found'
        });
      }

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('Error in getJobStatus:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get job status',
        message: error.message
      });
    }
  }

  // GET /api/oracle/jobs
  async getAllJobs(req, res) {
    try {
      const { status, limit = 50, offset = 0 } = req.query;

      const jobs = await queueService.getAllJobs({
        status,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: jobs,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: jobs.length
        }
      });
    } catch (error) {
      console.error('Error in getAllJobs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get jobs',
        message: error.message
      });
    }
  }

  // DELETE /api/oracle/jobs/:jobId
  async cancelJob(req, res) {
    try {
      const { jobId } = req.params;

      const result = await queueService.cancelJob(jobId);

      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'Job not found or cannot be cancelled'
        });
      }

      res.json({
        success: true,
        data: {
          jobId,
          status: 'cancelled',
          message: 'Job has been cancelled'
        }
      });
    } catch (error) {
      console.error('Error in cancelJob:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel job',
        message: error.message
      });
    }
  }

  // GET /api/oracle/health
  async healthCheck(req, res) {
    try {
      const health = await oracleService.getHealthStatus();

      const statusCode = health.overall === 'healthy' ? 200 : 503;

      res.status(statusCode).json({
        success: health.overall === 'healthy',
        data: health
      });
    } catch (error) {
      console.error('Error in healthCheck:', error);
      res.status(503).json({
        success: false,
        error: 'Health check failed',
        message: error.message
      });
    }
  }

  // GET /api/oracle/interpolate (for testing interpolation)
  async testInterpolation(req, res) {
    try {
      const { token, network, timestamp } = req.query;

      if (!token || !network || !timestamp) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: token, network, timestamp'
        });
      }

      const result = await interpolationService.interpolatePrice(
        token,
        network,
        parseInt(timestamp)
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error in testInterpolation:', error);
      res.status(500).json({
        success: false,
        error: 'Interpolation test failed',
        message: error.message
      });
    }
  }

  // GET /api/oracle/stats
  async getStats(req, res) {
    try {
      const stats = await oracleService.getSystemStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error in getStats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get system stats',
        message: error.message
      });
    }
  }
}

module.exports = new OracleController();
