const mongoose = require('mongoose');

const telemetrySchema = new mongoose.Schema({
  forkliftId: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  gps: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    altitude: Number,
    speed: Number,
    satellites: Number,
    valid: Boolean
  },
  accelerometer: {
    accelX: Number,
    accelY: Number,
    accelZ: Number,
    gyroX: Number,
    gyroY: Number,
    gyroZ: Number,
    temperature: Number,
    vibrationMagnitude: Number,
    tiltAngle: Number,
    movementDetected: Boolean
  },
  ultrasonic: {
    forkHeight: Number,
    loadDistance: Number,
    frontObstacle: Number,
    rearObstacle: Number,
    loadDetected: Boolean,
    frontWarning: Boolean,
    frontDanger: Boolean,
    rearWarning: Boolean,
    rearDanger: Boolean
  },
  rfid: {
    tagId: String,
    stationId: String,
    stationName: String,
    lastScanTime: Date,
    tagDetected: Boolean
  },
  activity: {
    state: {
      type: String,
      enum: ['PARKED', 'IDLE', 'DRIVING', 'WORKING', 'CHARGING', 'UNKNOWN'],
      default: 'UNKNOWN'
    },
    forkState: {
      type: String,
      enum: ['DOWN', 'PALLET_HEIGHT', 'RAISED', 'UNKNOWN'],
      default: 'UNKNOWN'
    },
    engineOn: Boolean,
    inMotion: Boolean
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
telemetrySchema.index({ forkliftId: 1, timestamp: -1 });
telemetrySchema.index({ 'activity.state': 1 });

// TTL index - automatically delete old data after 90 days
telemetrySchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('Telemetry', telemetrySchema);