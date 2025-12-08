const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const Forklift = require('../models/Forklift');
const Telemetry = require('../models/Telemetry');
const Station = require('../models/Station');

/**
 * Clean Database Script
 * Removes all seed/test data to prepare for real hardware data
 */
const cleanDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}\n`);

    // Get counts before deletion
    const forkliftCount = await Forklift.countDocuments();
    const telemetryCount = await Telemetry.countDocuments();
    const stationCount = await Station.countDocuments();

    console.log('📊 Current database contents:');
    console.log(`   Forklifts: ${forkliftCount}`);
    console.log(`   Telemetry: ${telemetryCount}`);
    console.log(`   Stations: ${stationCount}\n`);

    // Confirm deletion
    console.log('🗑️  Starting cleanup...\n');

    // Delete all telemetry data
    console.log('📊 Deleting telemetry data...');
    const telemetryResult = await Telemetry.deleteMany({});
    console.log(`✅ Deleted ${telemetryResult.deletedCount} telemetry records`);

    // Delete all forklift data
    console.log('🚜 Deleting forklift data...');
    const forkliftResult = await Forklift.deleteMany({});
    console.log(`✅ Deleted ${forkliftResult.deletedCount} forklifts`);

    // Optionally delete stations (uncomment if needed)
    // console.log('📍 Deleting station data...');
    // const stationResult = await Station.deleteMany({});
    // console.log(`✅ Deleted ${stationResult.deletedCount} stations`);

    console.log('\n🎉 Database cleanup complete!');
    console.log('✨ Database is now ready for hardware data');
    console.log('\n📝 Next steps:');
    console.log('   1. Configure your ESP32 devices');
    console.log('   2. Send telemetry data to POST /api/telemetry');
    console.log('   3. Forklifts will auto-register when they send data');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    process.exit(1);
  }
};

// Run cleanup
cleanDatabase();
