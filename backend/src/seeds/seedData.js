const mongoose = require('mongoose');
require('dotenv').config();

const Forklift = require('../models/Forklift');
const Station = require('../models/Station');
const Telemetry = require('../models/Telemetry');

// Sample forklifts - 20 diverse units across Helsinki/Espoo area
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
    model: 'Hyster E60XN',
    serialNumber: 'HY-2023-002',
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
    model: 'Crown RC 5500',
    serialNumber: 'CR-2023-003',
    status: 'active',
    currentActivity: 'WORKING',
    batteryLevel: 91,
    currentLocation: {
      latitude: 60.1692,
      longitude: 24.9361
    }
  },
  {
    forkliftId: 'FL-004',
    name: 'Forklift Delta',
    model: 'Yale ERP030VT',
    serialNumber: 'YL-2023-004',
    status: 'active',
    currentActivity: 'CHARGING',
    batteryLevel: 45,
    currentLocation: {
      latitude: 60.1700,
      longitude: 24.9345
    }
  },
  {
    forkliftId: 'FL-005',
    name: 'Forklift Epsilon',
    model: 'Raymond 7400',
    serialNumber: 'RM-2023-005',
    status: 'active',
    currentActivity: 'PARKED',
    batteryLevel: 78,
    currentLocation: {
      latitude: 60.1688,
      longitude: 24.9370
    }
  },
  {
    forkliftId: 'FL-006',
    name: 'Forklift Zeta',
    model: 'Toyota 8FBMT25',
    serialNumber: 'TY-2023-006',
    status: 'active',
    currentActivity: 'WORKING',
    batteryLevel: 68,
    currentLocation: {
      latitude: 60.1705,
      longitude: 24.9340
    }
  },
  {
    forkliftId: 'FL-007',
    name: 'Forklift Eta',
    model: 'Hyster J40XN',
    serialNumber: 'HY-2023-007',
    status: 'active',
    currentActivity: 'DRIVING',
    batteryLevel: 55,
    currentLocation: {
      latitude: 60.1680,
      longitude: 24.9365
    }
  },
  {
    forkliftId: 'FL-008',
    name: 'Forklift Theta',
    model: 'Crown ESR5000',
    serialNumber: 'CR-2023-008',
    status: 'maintenance',
    currentActivity: 'PARKED',
    batteryLevel: 15,
    currentLocation: {
      latitude: 60.1710,
      longitude: 24.9350
    }
  },
  {
    forkliftId: 'FL-009',
    name: 'Forklift Iota',
    model: 'Yale MPB040VG',
    serialNumber: 'YL-2023-009',
    status: 'active',
    currentActivity: 'IDLE',
    batteryLevel: 82,
    currentLocation: {
      latitude: 60.1675,
      longitude: 24.9380
    }
  },
  {
    forkliftId: 'FL-010',
    name: 'Forklift Kappa',
    model: 'Raymond 8410',
    serialNumber: 'RM-2023-010',
    status: 'active',
    currentActivity: 'WORKING',
    batteryLevel: 94,
    currentLocation: {
      latitude: 60.1715,
      longitude: 24.9335
    }
  },
  {
    forkliftId: 'FL-011',
    name: 'Forklift Lambda',
    model: 'Toyota 7FBEU20',
    serialNumber: 'TY-2023-011',
    status: 'active',
    currentActivity: 'DRIVING',
    batteryLevel: 73,
    currentLocation: {
      latitude: 60.1665,
      longitude: 24.9390
    }
  },
  {
    forkliftId: 'FL-012',
    name: 'Forklift Mu',
    model: 'Hyster E80XN',
    serialNumber: 'HY-2023-012',
    status: 'active',
    currentActivity: 'CHARGING',
    batteryLevel: 28,
    currentLocation: {
      latitude: 60.1720,
      longitude: 24.9355
    }
  },
  {
    forkliftId: 'FL-013',
    name: 'Forklift Nu',
    model: 'Crown FC 5200',
    serialNumber: 'CR-2023-013',
    status: 'active',
    currentActivity: 'WORKING',
    batteryLevel: 87,
    currentLocation: {
      latitude: 60.1660,
      longitude: 24.9375
    }
  },
  {
    forkliftId: 'FL-014',
    name: 'Forklift Xi',
    model: 'Yale ERC050VG',
    serialNumber: 'YL-2023-014',
    status: 'active',
    currentActivity: 'IDLE',
    batteryLevel: 41,
    currentLocation: {
      latitude: 60.1725,
      longitude: 24.9330
    }
  },
  {
    forkliftId: 'FL-015',
    name: 'Forklift Omicron',
    model: 'Raymond 7310',
    serialNumber: 'RM-2023-015',
    status: 'active',
    currentActivity: 'PARKED',
    batteryLevel: 100,
    currentLocation: {
      latitude: 60.1655,
      longitude: 24.9395
    }
  },
  {
    forkliftId: 'FL-016',
    name: 'Forklift Pi',
    model: 'Toyota 8FBN25',
    serialNumber: 'TY-2023-016',
    status: 'active',
    currentActivity: 'DRIVING',
    batteryLevel: 66,
    currentLocation: {
      latitude: 60.1730,
      longitude: 24.9325
    }
  },
  {
    forkliftId: 'FL-017',
    name: 'Forklift Rho',
    model: 'Hyster H80FT',
    serialNumber: 'HY-2023-017',
    status: 'active',
    currentActivity: 'WORKING',
    batteryLevel: 79,
    currentLocation: {
      latitude: 60.1650,
      longitude: 24.9400
    }
  },
  {
    forkliftId: 'FL-018',
    name: 'Forklift Sigma',
    model: 'Crown SP 3500',
    serialNumber: 'CR-2023-018',
    status: 'active',
    currentActivity: 'IDLE',
    batteryLevel: 52,
    currentLocation: {
      latitude: 60.1735,
      longitude: 24.9360
    }
  },
  {
    forkliftId: 'FL-019',
    name: 'Forklift Tau',
    model: 'Yale GDP060VX',
    serialNumber: 'YL-2023-019',
    status: 'maintenance',
    currentActivity: 'PARKED',
    batteryLevel: 18,
    currentLocation: {
      latitude: 60.1645,
      longitude: 24.9385
    }
  },
  {
    forkliftId: 'FL-020',
    name: 'Forklift Upsilon',
    model: 'Raymond 9600',
    serialNumber: 'RM-2023-020',
    status: 'active',
    currentActivity: 'CHARGING',
    batteryLevel: 35,
    currentLocation: {
      latitude: 60.1740,
      longitude: 24.9345
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
  // Base locations for all 20 forklifts (matching their currentLocation)
  const baseLocation = {
    'FL-001': { lat: 60.1695, lon: 24.9354 },
    'FL-002': { lat: 60.1698, lon: 24.9358 },
    'FL-003': { lat: 60.1692, lon: 24.9361 },
    'FL-004': { lat: 60.1700, lon: 24.9345 },
    'FL-005': { lat: 60.1688, lon: 24.9370 },
    'FL-006': { lat: 60.1705, lon: 24.9340 },
    'FL-007': { lat: 60.1680, lon: 24.9365 },
    'FL-008': { lat: 60.1710, lon: 24.9350 },
    'FL-009': { lat: 60.1675, lon: 24.9380 },
    'FL-010': { lat: 60.1715, lon: 24.9335 },
    'FL-011': { lat: 60.1665, lon: 24.9390 },
    'FL-012': { lat: 60.1720, lon: 24.9355 },
    'FL-013': { lat: 60.1660, lon: 24.9375 },
    'FL-014': { lat: 60.1725, lon: 24.9330 },
    'FL-015': { lat: 60.1655, lon: 24.9395 },
    'FL-016': { lat: 60.1730, lon: 24.9325 },
    'FL-017': { lat: 60.1650, lon: 24.9400 },
    'FL-018': { lat: 60.1735, lon: 24.9360 },
    'FL-019': { lat: 60.1645, lon: 24.9385 },
    'FL-020': { lat: 60.1740, lon: 24.9345 }
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

    // Clear existing data by dropping collections
    console.log('🗑️  Dropping collections...');
    await Forklift.collection.drop().catch(err => {
      if (err.code !== 26) throw err; // Ignore "namespace not found" error
      console.log('Forklifts collection did not exist, skipping drop.');
    });
    await Station.collection.drop().catch(err => {
      if (err.code !== 26) throw err; // Ignore "namespace not found" error
      console.log('Stations collection did not exist, skipping drop.');
    });
    await Telemetry.collection.drop().catch(err => {
      if (err.code !== 26) throw err; // Ignore "namespace not found" error
      console.log('Telemetry collection did not exist, skipping drop.');
    });
    console.log('✅ Collections dropped.');

    // Insert forklifts
    console.log('🚜 Creating forklifts...');
    await Forklift.insertMany(forklifts);
    console.log(`✅ Created ${forklifts.length} forklifts`);

    // Insert stations
    console.log('📍 Creating stations...');
    await Station.insertMany(stations);
    console.log(`✅ Created ${stations.length} stations`);

    // Insert telemetry data - create 10 telemetry records per forklift
    console.log('📊 Creating telemetry data...');
    const telemetryData = [];

    forklifts.forEach(forklift => {
      const activity = forklift.currentActivity;
      const records = Array(10).fill(null).map(() =>
        generateTelemetry(forklift.forkliftId, activity)
      );
      telemetryData.push(...records);
    });

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