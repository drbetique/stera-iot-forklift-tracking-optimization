const mongoose = require('mongoose');
require('dotenv').config();

const Forklift = require('../models/Forklift');

// Sample telemetry data with varying sensor readings for each forklift
const sampleTelemetryData = [
  {
    accelerometer: {
      accelX: -0.935,
      accelY: 0.190,
      accelZ: -0.303,
      gyroX: -1.07,
      gyroY: 0.32,
      gyroZ: 0.66,
      temperature: 28.1,
      vibrationMagnitude: 1.001
    },
    activity: { state: 'WORKING', inMotion: false, forkState: 'UNKNOWN' },
    gps: { latitude: 60.1695, longitude: 24.9354, valid: false }
  },
  {
    accelerometer: {
      accelX: -0.12,
      accelY: 0.05,
      accelZ: 0.98,
      gyroX: -0.15,
      gyroY: 0.08,
      gyroZ: 0.12,
      temperature: 24.5,
      vibrationMagnitude: 0.99
    },
    activity: { state: 'IDLE', inMotion: false, forkState: 'UNKNOWN' },
    gps: { latitude: 60.1705, longitude: 24.9364, valid: false }
  },
  {
    accelerometer: {
      accelX: -0.45,
      accelY: 0.32,
      accelZ: -0.15,
      gyroX: -0.85,
      gyroY: 0.45,
      gyroZ: 0.52,
      temperature: 32.3,
      vibrationMagnitude: 1.85
    },
    activity: { state: 'DRIVING', inMotion: true, forkState: 'UNKNOWN' },
    gps: { latitude: 60.1715, longitude: 24.9374, valid: false }
  },
  {
    accelerometer: {
      accelX: -0.02,
      accelY: 0.01,
      accelZ: 1.00,
      gyroX: -0.05,
      gyroY: 0.02,
      gyroZ: 0.03,
      temperature: 22.8,
      vibrationMagnitude: 0.45
    },
    activity: { state: 'PARKED', inMotion: false, forkState: 'UNKNOWN' },
    gps: { latitude: 60.1725, longitude: 24.9384, valid: false }
  },
  {
    accelerometer: {
      accelX: -1.12,
      accelY: 0.45,
      accelZ: -0.55,
      gyroX: -1.25,
      gyroY: 0.68,
      gyroZ: 0.82,
      temperature: 35.2,
      vibrationMagnitude: 2.45
    },
    activity: { state: 'WORKING', inMotion: false, forkState: 'UNKNOWN' },
    gps: { latitude: 60.1735, longitude: 24.9394, valid: false }
  }
];

async function addSampleTelemetry() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    // Get all forklifts
    const forklifts = await Forklift.find({});
    console.log(`\n📋 Found ${forklifts.length} forklifts\n`);

    // Update each forklift with sample telemetry data
    for (let i = 0; i < forklifts.length; i++) {
      const forklift = forklifts[i];
      const telemetryIndex = i % sampleTelemetryData.length; // Cycle through sample data
      const telemetry = {
        ...sampleTelemetryData[telemetryIndex],
        forkliftId: forklift.forkliftId,
        timestamp: new Date()
      };

      await Forklift.findByIdAndUpdate(forklift._id, {
        lastTelemetry: telemetry,
        currentActivity: telemetry.activity.state,
        currentLocation: telemetry.gps,
        lastSeen: new Date()
      });

      console.log(`✓ Updated ${forklift.name} (${forklift.forkliftId})`);
      console.log(`  Activity: ${telemetry.activity.state}`);
      console.log(`  Temperature: ${telemetry.accelerometer.temperature}°C`);
      console.log(`  Vibration: ${telemetry.accelerometer.vibrationMagnitude}g`);
      console.log('');
    }

    console.log('✅ All forklifts updated with sample telemetry data!');
    console.log('\n🎯 Refresh your dashboard to see human-readable sensor insights!\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addSampleTelemetry();
