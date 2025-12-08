const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import database connection
const connectDB = require('./src/config/database');

// Import routes
const authRoutes = require('./src/routes/auth');
const telemetryRoutes = require('./src/routes/telemetry');
const forkliftRoutes = require('./src/routes/forklifts');
const stationRoutes = require('./src/routes/stations');
const sensorRoutes = require('./src/routes/sensors');
const analyticsRoutes = require('./src/routes/analytics');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'Stera IoT Forklift Tracking API',
    version: '1.0.0',
    status: 'running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    endpoints: {
      auth: '/api/auth',
      telemetry: '/api/telemetry',
      forklifts: '/api/forklifts',
      stations: '/api/stations',
      sensors: '/api/sensors',
      analytics: '/api/analytics',
      health: '/health'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  const healthcheck = {
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  };
  res.json(healthcheck);
});

// API Routes
app.use('/api/auth', authRoutes); // Authentication routes (public)
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/forklifts', forkliftRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/sensors', sensorRoutes); // Sensor data from InfluxDB
app.use('/api/analytics', analyticsRoutes); // Analytics data from MQTT analytics service

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    availableEndpoints: {
      auth: '/api/auth',
      telemetry: '/api/telemetry',
      forklifts: '/api/forklifts',
      stations: '/api/stations',
      sensors: '/api/sensors',
      analytics: '/api/analytics'
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Something went wrong!',
    message: err.message
  });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`📚 API Endpoints:`);
  console.log(`   Auth:`);
  console.log(`   - POST   /api/auth/login`);
  console.log(`   - POST   /api/auth/register (Admin only)`);
  console.log(`   - GET    /api/auth/me (Protected)`);
  console.log(`   - POST   /api/auth/logout (Protected)`);
  console.log(`   Data:`);
  console.log(`   - POST   /api/telemetry`);
  console.log(`   - GET    /api/telemetry/:forkliftId/latest`);
  console.log(`   - GET    /api/telemetry/:forkliftId/history`);
  console.log(`   - GET    /api/forklifts`);
  console.log(`   - POST   /api/forklifts`);
  console.log(`   - GET    /api/forklifts/:forkliftId`);
  console.log(`   - GET    /api/stations`);
  console.log(`   - POST   /api/stations`);
  console.log(`   Analytics:`);
  console.log(`   - POST   /api/analytics`);
  console.log(`   - GET    /api/analytics/latest`);
  console.log(`   - GET    /api/analytics/history`);
  console.log(`   - GET    /api/analytics/impact-events`);
  console.log(`   - GET    /api/analytics/fleet-summary`);
});

module.exports = app;
