const express = require('express');
const router = express.Router();
const Telemetry = require('../models/Telemetry');
const Forklift = require('../models/Forklift');

// POST - Receive telemetry data from ESP32
router.post('/', async (req, res) => {
  try {
    const telemetryData = req.body;

    // Save telemetry to database
    const telemetry = new Telemetry(telemetryData);
    await telemetry.save();

    // Update forklift last seen and location
    await Forklift.findOneAndUpdate(
      { forkliftId: telemetryData.forkliftId },
      {
        lastSeen: new Date(),
        currentLocation: telemetryData.gps,
        currentActivity: telemetryData.activity.state,
        batteryLevel: telemetryData.ultrasonic?.loadDetected ? 80 : 90 // Placeholder
      },
      { upsert: true, new: true }
    );

    res.status(201).json({
      success: true,
      message: 'Telemetry data received',
      data: telemetry
    });

  } catch (error) {
    console.error('Error saving telemetry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save telemetry data',
      error: error.message
    });
  }
});

// GET - Get latest telemetry for a forklift
router.get('/:forkliftId/latest', async (req, res) => {
  try {
    const { forkliftId } = req.params;

    const latestTelemetry = await Telemetry
      .findOne({ forkliftId })
      .sort({ timestamp: -1 })
      .limit(1);

    if (!latestTelemetry) {
      return res.status(404).json({
        success: false,
        message: 'No telemetry data found for this forklift'
      });
    }

    res.json({
      success: true,
      data: latestTelemetry
    });

  } catch (error) {
    console.error('Error fetching telemetry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch telemetry data',
      error: error.message
    });
  }
});

// GET - Get telemetry history with time range
router.get('/:forkliftId/history', async (req, res) => {
  try {
    const { forkliftId } = req.params;
    const { startDate, endDate, limit = 100 } = req.query;

    const query = { forkliftId };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const telemetryHistory = await Telemetry
      .find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: telemetryHistory.length,
      data: telemetryHistory
    });

  } catch (error) {
    console.error('Error fetching telemetry history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch telemetry history',
      error: error.message
    });
  }
});

module.exports = router;