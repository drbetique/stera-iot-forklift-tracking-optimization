const express = require('express');
const router = express.Router();
const Analytics = require('../models/Analytics');

/**
 * POST /api/analytics
 * Store analytics data from the analytics service
 */
router.post('/', async (req, res) => {
  try {
    const analyticsData = new Analytics(req.body);
    await analyticsData.save();

    res.status(201).json({
      success: true,
      message: 'Analytics data stored successfully',
      data: {
        id: analyticsData._id,
        type: analyticsData.type,
        timestamp: analyticsData.timestamp
      }
    });
  } catch (error) {
    console.error('Error saving analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to store analytics data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/analytics/latest
 * Get the most recent analytics by type
 */
router.get('/latest', async (req, res) => {
  try {
    const { type } = req.query;

    const query = type ? { type } : {};

    const latestAnalytics = await Analytics.findOne(query)
      .sort({ timestamp: -1 })
      .lean();

    if (!latestAnalytics) {
      return res.json({
        success: true,
        data: null,
        message: 'No analytics data available'
      });
    }

    res.json({
      success: true,
      data: latestAnalytics
    });
  } catch (error) {
    console.error('Error fetching latest analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/analytics/history
 * Get analytics history with filters
 */
router.get('/history', async (req, res) => {
  try {
    const { type, startDate, endDate, limit = 100 } = req.query;

    const query = {};

    if (type) {
      query.type = type;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const analytics = await Analytics.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: analytics,
      count: analytics.length
    });
  } catch (error) {
    console.error('Error fetching analytics history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/analytics/impact-events
 * Get recent impact events
 */
router.get('/impact-events', async (req, res) => {
  try {
    const { forkliftId, limit = 20, severity } = req.query;

    // Find analytics with impact events
    const query = {
      type: 'impact_events',
      'impactEvents.0': { $exists: true } // Has at least one impact event
    };

    const analytics = await Analytics.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();

    // Flatten impact events from all analytics records
    let impactEvents = [];
    analytics.forEach(record => {
      if (record.impactEvents && record.impactEvents.length > 0) {
        impactEvents.push(...record.impactEvents.map(event => ({
          ...event,
          analyticsRecordId: record._id,
          analyticsTimestamp: record.timestamp
        })));
      }
    });

    // Filter by forkliftId if provided
    if (forkliftId) {
      impactEvents = impactEvents.filter(e => e.forkliftId === forkliftId);
    }

    // Filter by severity if provided
    if (severity) {
      impactEvents = impactEvents.filter(e => e.severity === severity);
    }

    // Sort by timestamp descending and limit
    impactEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    impactEvents = impactEvents.slice(0, parseInt(limit));

    res.json({
      success: true,
      data: impactEvents,
      count: impactEvents.length
    });
  } catch (error) {
    console.error('Error fetching impact events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch impact events',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/analytics/fleet-summary
 * Get the latest fleet summary
 */
router.get('/fleet-summary', async (req, res) => {
  try {
    const latestSummary = await Analytics.findOne({ type: 'fleet_summary' })
      .sort({ timestamp: -1 })
      .lean();

    if (!latestSummary) {
      return res.json({
        success: true,
        data: null,
        message: 'No fleet summary available'
      });
    }

    res.json({
      success: true,
      data: latestSummary
    });
  } catch (error) {
    console.error('Error fetching fleet summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fleet summary',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * DELETE /api/analytics/old
 * Manually delete old analytics (for testing, normally handled by TTL)
 */
router.delete('/old', async (req, res) => {
  try {
    const { daysOld = 90 } = req.query;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(daysOld));

    const result = await Analytics.deleteMany({
      timestamp: { $lt: cutoffDate }
    });

    res.json({
      success: true,
      message: `Deleted analytics older than ${daysOld} days`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting old analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete old analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
