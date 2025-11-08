const mongoose = require('mongoose');

const forkliftSchema = new mongoose.Schema({
  forkliftId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  serialNumber: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  currentLocation: {
    latitude: Number,
    longitude: Number
  },
  currentActivity: {
    type: String,
    enum: ['PARKED', 'IDLE', 'DRIVING', 'WORKING', 'CHARGING', 'UNKNOWN'],
    default: 'UNKNOWN'
  },
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

// Index for faster queries
forkliftSchema.index({ forkliftId: 1 });
forkliftSchema.index({ status: 1 });

module.exports = mongoose.model('Forklift', forkliftSchema);
