const mongoose = require('mongoose');
require('dotenv').config();

const Forklift = require('../models/Forklift');
const Station = require('../models/Station');
const Telemetry = require('../models/Telemetry');

// Sample forklifts
const forklifts = [
  {
    forkliftId: 'FL-001',
    name: 'Forklift Alpha',
    model: 'Toyota 8FBE20U',
    serialNumber: 'TY-2023-001',
    status: 'active',
    currentActivity: 'DRIVING',
    batteryLevel: 85,
    currentLocation: {
      latitude: 60.1695,
      longitude: 24.9354
    }
  },
  {
    forkliftId: 'FL-002',
    name: 'Forklift Beta',
    model: 'Linde E20',
    serialNumber: 'LI-2023-002',
    status: 'active',
    currentActivity: 'IDLE',
    batteryLevel: 62,
    currentLocation: {
      latitude: 60.1698,
      longitude: 24.9358
    }
  },
  {
    forkliftId: 'FL-003',
    name: 'Forklift Gamma',
    model: 'Toyota 8FBE20U',
    serialNumber: 'TY-2023-003',
    status: 'active',
    currentActivity: 'WORKING',
    batteryLevel: 91,
    currentLocation: {
      latitude: 60.1692,
      longitude: 24.9361
    }
  }
];

// Sample stations
const stations = [
  {
    stationId: 'ST-001',
    name: 'Loading Dock A',
    type: 'loading',
    rfidTagId: '04A32BC21F80',
    location: {
      latitude: 60.1695,
      longitude: 24.9354,
      zone: 'North Wing',
      description: 'Main loading area for incoming materials'
    },
    active: true
  },
  {
    stationId: 'ST-002',
    name: 'Loading Dock B',
    type: 'loading',
    rfidTagId: '04B45CD32E91',
    location: {
      latitude: 60.1697,
      longitude: 24.9356,
      zone: 'North Wing',
      description: 'Secondary loading dock'
    },
    active: true
  },
  {
    stationId: 'ST-003',
    name: 'Storage Zone 1',
    type: 'storage',
    rfidTagId: '04C56DE43FA2',
    location: {
      latitude: 60.1693,
      longitude: 24.9360,
      zone: 'Central Storage',
      description: 'Primary warehouse storage area'
    },
    active: true
  },
  {
    stationId: 'ST-004',
    name: 'Charging Station',
    type: 'charging',
    rfidTagId: '04E78FA65HC4',
    location: {
      latitude: 60.1690,
      longitude: 24.9352,
      zone: 'Maintenance Area',
      description: 'Battery charging station'
    },
    active: true
  },
  {
    stationId: 'ST-005',
    name: 'Production Line A',
    type: 'production',
    rfidTagId: '04G90BC87JE6',
    location: {
      latitude: 60.1699,
      longitude: 24.9365,
      zone: 'Production Floor',
      description: 'Assembly line material supply point'
    },
    active: true
  }
];

// Generate sample telemetry data
const generateTelemetry = (forkliftId, activity) => {
  const baseLocation = {
    'FL-001': { lat: 60.1695, lon: 24.9354 },
    'FL-002': { lat: 60.1698, lon: 24.9358 },
    'FL-003': { lat: 60.1692, lon: 24.9361 }
  };

  const activityData = {
    'DRIVING': { vibration: 0.45, forkHeight: 15, speed: 8.5 },
    'IDLE': { vibration: 0.32, forkHeight: 10, speed: 0 },
    'WORKING': { vibration: 0.55, forkHeight: 120, speed: 2.1 },
    'PARKED': { vibration: 0.05, forkHeight: 8, speed: 0 }
  };

  const data = activityData[activity] || activityData['IDLE'];
  const base = baseLocation[forkliftId];

  return {
    forkliftId,
    timestamp: new Date(),
    gps: {
      latitude: base.lat + (Math.random() - 0.5) * 0.0001,
      longitude: base.lon + (Math.random() - 0.5) * 0.0001,
      altitude: 10 + Math.random() * 5,
      speed: data.speed + (Math.random() - 0.5),
      satellites: 8 + Math.floor(Math.random() * 4),
      valid: true
    },
    accelerometer: {
      accelX: (Math.random() - 0.5) * 0.2,
      accelY: (Math.random() - 0.5) * 0.2,
      accelZ: 9.8 + (Math.random() - 0.5) * 0.1,
      gyroX: (Math.random() - 0.5) * 5,
      gyroY: (Math.random() - 0.5) * 5,
      gyroZ: (Math.random() - 0.5) * 5,
      temperature: 22 + Math.random() * 3,
      vibrationMagnitude: data.vibration,
      tiltAngle: (Math.random() - 0.5) * 10,
      movementDetected: activity === 'DRIVING' || activity === 'WORKING'
    },
    ultrasonic: {
      forkHeight: data.forkHeight + Math.random() * 5,
      loadDistance: activity === 'WORKING' ? 25 + Math.random() * 10 : 150,
      frontObstacle: 200 + Math.random() * 100,
      rearObstacle: 200 + Math.random() * 100,
      loadDetected: activity === 'WORKING',
      frontWarning: false,
      frontDanger: false,
      rearWarning: false,
      rearDanger: false
    },
    activity: {
      state: activity,
      forkState: data.forkHeight > 50 ? 'RAISED' : 'DOWN',
      engineOn: activity !== 'PARKED',
      inMotion: activity === 'DRIVING' || activity === 'WORKING'
    }
  };
};

// Seed function
const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Forklift.deleteMany({});
    await Station.deleteMany({});
    await Telemetry.deleteMany({});

    // Insert forklifts
    console.log('🚜 Creating forklifts...');
    await Forklift.insertMany(forklifts);
    console.log(`✅ Created ${forklifts.length} forklifts`);

    // Insert stations
    console.log('📍 Creating stations...');
    await Station.insertMany(stations);
    console.log(`✅ Created ${stations.length} stations`);

    // Insert telemetry data
    console.log('📊 Creating telemetry data...');
    const telemetryData = [
      ...Array(10).fill(null).map(() => generateTelemetry('FL-001', 'DRIVING')),
      ...Array(10).fill(null).map(() => generateTelemetry('FL-002', 'IDLE')),
      ...Array(10).fill(null).map(() => generateTelemetry('FL-003', 'WORKING'))
    ];
    await Telemetry.insertMany(telemetryData);
    console.log(`✅ Created ${telemetryData.length} telemetry records`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Forklifts: ${forklifts.length}`);
    console.log(`   Stations: ${stations.length}`);
    console.log(`   Telemetry: ${telemetryData.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeding
seedDatabase();