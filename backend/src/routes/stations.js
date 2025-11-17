const express = require('express');
const router = express.Router();
const Station = require('../models/Station');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET - Get all stations
router.get('/', async (req, res) => {
  try {
    const { type, active } = req.query;
    
    const query = {};
    if (type) query.type = type;
    if (active !== undefined) query.active = active === 'true';

    const stations = await Station.find(query).sort({ name: 1 });

    res.json({
      success: true,
      count: stations.length,
      data: stations
    });

  } catch (error) {
    console.error('Error fetching stations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stations',
      error: error.message
    });
  }
});

// GET - Get single station
router.get('/:stationId', async (req, res) => {
  try {
    const { stationId } = req.params;

    const station = await Station.findOne({ stationId });

    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }

    res.json({
      success: true,
      data: station
    });

  } catch (error) {
    console.error('Error fetching station:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch station',
      error: error.message
    });
  }
});

// POST - Create new station (Admin and Operator only)
router.post('/', requireRole(['admin', 'operator']), async (req, res) => {
  try {
    const station = new Station(req.body);
    await station.save();

    res.status(201).json({
      success: true,
      message: 'Station created successfully',
      data: station
    });

  } catch (error) {
    console.error('Error creating station:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create station',
      error: error.message
    });
  }
});

// PUT - Update station (Admin and Operator only)
router.put('/:stationId', requireRole(['admin', 'operator']), async (req, res) => {
  try {
    const { stationId } = req.params;

    const station = await Station.findOneAndUpdate(
      { stationId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }

    res.json({
      success: true,
      message: 'Station updated successfully',
      data: station
    });

  } catch (error) {
    console.error('Error updating station:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update station',
      error: error.message
    });
  }
});

module.exports = router;
