const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema({
  stationId: {
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
  type: {
    type: String,
    enum: ['loading', 'unloading', 'storage', 'charging', 'maintenance', 'production', 'other'],
    required: true
  },
  rfidTagId: {
    type: String,
    unique: true,
    sparse: true
  },
  location: {
    latitude: Number,
    longitude: Number,
    floor: String,
    zone: String,
    description: String
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster lookups
stationSchema.index({ stationId: 1 });
stationSchema.index({ rfidTagId: 1 });
stationSchema.index({ type: 1 });

module.exports = mongoose.model('Station', stationSchema);