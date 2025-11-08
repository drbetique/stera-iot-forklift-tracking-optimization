const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import database connection
const connectDB = require('./src/config/database');

// Import routes
const telemetryRoutes = require('./src/routes/telemetry');
const forkliftRoutes = require('./src/routes/forklifts');
const stationRoutes = require('./src/routes/stations');

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
      telemetry: '/api/telemetry',
      forklifts: '/api/forklifts',
      stations: '/api/stations',
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
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/forklifts', forkliftRoutes);
app.use('/api/stations', stationRoutes);

// Handle 404
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Route not found',
    availableEndpoints: {
      telemetry: '/api/telemetry',
      forklifts: '/api/forklifts',
      stations: '/api/stations'
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
  console.log(`   - POST   /api/telemetry`);
  console.log(`   - GET    /api/telemetry/:forkliftId/latest`);
  console.log(`   - GET    /api/telemetry/:forkliftId/history`);
  console.log(`   - GET    /api/forklifts`);
  console.log(`   - POST   /api/forklifts`);
  console.log(`   - GET    /api/forklifts/:forkliftId`);
  console.log(`   - GET    /api/stations`);
  console.log(`   - POST   /api/stations`);
});

module.exports = app;
