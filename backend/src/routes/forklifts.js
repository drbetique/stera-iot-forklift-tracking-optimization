const express = require('express');
const router = express.Router();
const Forklift = require('../models/Forklift');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET - Get all forklifts
router.get('/', async (req, res) => {
  try {
    const forklifts = await Forklift.find().sort({ forkliftId: 1 });

    res.json({
      success: true,
      count: forklifts.length,
      data: forklifts
    });

  } catch (error) {
    console.error('Error fetching forklifts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch forklifts',
      error: error.message
    });
  }
});

// GET - Get single forklift by ID
router.get('/:forkliftId', async (req, res) => {
  try {
    const { forkliftId } = req.params;

    const forklift = await Forklift.findOne({ forkliftId });

    if (!forklift) {
      return res.status(404).json({
        success: false,
        message: 'Forklift not found'
      });
    }

    res.json({
      success: true,
      data: forklift
    });

  } catch (error) {
    console.error('Error fetching forklift:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch forklift',
      error: error.message
    });
  }
});

// POST - Create new forklift (Admin and Operator only)
router.post('/', requireRole(['admin', 'operator']), async (req, res) => {
  try {
    const forklift = new Forklift(req.body);
    await forklift.save();

    res.status(201).json({
      success: true,
      message: 'Forklift created successfully',
      data: forklift
    });

  } catch (error) {
    console.error('Error creating forklift:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create forklift',
      error: error.message
    });
  }
});

// PUT - Update forklift (Admin and Operator only)
router.put('/:forkliftId', requireRole(['admin', 'operator']), async (req, res) => {
  try {
    const { forkliftId } = req.params;

    const forklift = await Forklift.findOneAndUpdate(
      { forkliftId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!forklift) {
      return res.status(404).json({
        success: false,
        message: 'Forklift not found'
      });
    }

    res.json({
      success: true,
      message: 'Forklift updated successfully',
      data: forklift
    });

  } catch (error) {
    console.error('Error updating forklift:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update forklift',
      error: error.message
    });
  }
});

module.exports = router;
