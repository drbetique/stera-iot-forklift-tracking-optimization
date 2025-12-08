const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },

  // Analytics type (summary, impact_events, etc.)
  type: {
    type: String,
    enum: ['fleet_summary', 'impact_events', 'vibration_analysis', 'battery_health'],
    required: true,
    index: true
  },

  // Time window for this analytics data
  timeWindow: {
    start: Date,
    end: Date,
    durationSeconds: Number
  },

  // Fleet-wide summary statistics
  fleetSummary: {
    totalSamples: Number,
    forkliftCount: Number,
    averageAcceleration: Number,
    maxAcceleration: Number,
    totalImpactEvents: Number,
    byForklift: [{
      forkliftId: String,
      samples: Number,
      avgAcceleration: Number,
      maxAcceleration: Number,
      impactEvents: Number
    }]
  },

  // Impact events data
  impactEvents: [{
    timestamp: Date,
    forkliftId: String,
    accelTotalG: Number,
    accelX: Number,
    accelY: Number,
    accelZ: Number,
    location: {
      latitude: Number,
      longitude: Number
    },
    activity: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    }
  }],

  // Vibration analysis
  vibrationAnalysis: {
    averageVibration: Number,
    maxVibration: Number,
    byForklift: [{
      forkliftId: String,
      avgVibration: Number,
      maxVibration: Number,
      excessiveVibrationEvents: Number
    }]
  },

  // Battery health trends
  batteryHealth: {
    fleetAverage: Number,
    criticalCount: Number,
    lowCount: Number,
    byForklift: [{
      forkliftId: String,
      currentLevel: Number,
      trend: String, // 'improving', 'stable', 'declining'
      estimatedHoursRemaining: Number
    }]
  },

  // Metadata
  metadata: {
    source: String, // 'mqtt_analytics', 'scheduled_job', etc.
    version: String,
    processingTimeMs: Number
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Indexes for efficient querying
analyticsSchema.index({ timestamp: -1 });
analyticsSchema.index({ type: 1, timestamp: -1 });
analyticsSchema.index({ 'timeWindow.end': -1 });

// TTL index - automatically delete analytics older than 90 days
analyticsSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const Analytics = mongoose.model('Analytics', analyticsSchema);

module.exports = Analytics;
