const express = require('express');
const router = express.Router();
const influxService = require('../services/influxService');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication to all sensor endpoints
router.use(authenticateToken);

/**
 * GET /api/sensors/:forkliftId/latest
 * Get latest sensor data for a forklift
 */
router.get('/:forkliftId/latest', async (req, res) => {
  try {
    const { forkliftId } = req.params;

    if (!influxService.enabled) {
      return res.status(503).json({
        success: false,
        message: 'Sensor data service is not available. InfluxDB not configured.'
      });
    }

    const sensorData = await influxService.getLatestSensorData(forkliftId);

    if (!sensorData) {
      return res.status(404).json({
        success: false,
        message: 'No sensor data found for this forklift'
      });
    }

    res.json({
      success: true,
      data: sensorData
    });

  } catch (error) {
    console.error('Error fetching latest sensor data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sensor data',
      error: error.message
    });
  }
});

/**
 * GET /api/sensors/:forkliftId/history
 * Get sensor data history for a forklift
 */
router.get('/:forkliftId/history', async (req, res) => {
  try {
    const { forkliftId } = req.params;
    const { startTime, endTime, limit } = req.query;

    if (!influxService.enabled) {
      return res.status(503).json({
        success: false,
        message: 'Sensor data service is not available. InfluxDB not configured.'
      });
    }

    const options = {};
    if (startTime) options.startTime = startTime;
    if (endTime) options.endTime = endTime;
    if (limit) options.limit = parseInt(limit);

    const history = await influxService.getSensorHistory(forkliftId, options);

    res.json({
      success: true,
      count: history.length,
      data: history
    });

  } catch (error) {
    console.error('Error fetching sensor history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sensor history',
      error: error.message
    });
  }
});

/**
 * GET /api/sensors/:forkliftId/stats
 * Get aggregated sensor statistics
 */
router.get('/:forkliftId/stats', async (req, res) => {
  try {
    const { forkliftId } = req.params;
    const { window = '5m' } = req.query;

    if (!influxService.enabled) {
      return res.status(503).json({
        success: false,
        message: 'Sensor data service is not available. InfluxDB not configured.'
      });
    }

    const stats = await influxService.getAggregatedStats(forkliftId, window);

    res.json({
      success: true,
      count: stats.length,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching sensor stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sensor statistics',
      error: error.message
    });
  }
});

module.exports = router;
