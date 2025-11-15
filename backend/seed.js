// backend/seed.js
require('dotenv').config();
const mongoose = require('mongoose');

async function cleanupAndSeed() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Drop the entire collection to remove all indexes
    console.log('🗑️  Dropping forklifts collection...');
    try {
      await db.collection('forklifts').drop();
      console.log('✅ Collection dropped');
    } catch (err) {
      console.log('⚠️  Collection does not exist or already dropped');
    }

    // Insert fresh data directly
    const collection = db.collection('forklifts');
    
    const testForklifts = [
      {
        forkliftId: 'FL-001',
        name: 'Forklift Alpha',
        model: 'Toyota 8FBE20U',
        currentActivity: 'DRIVING',
        batteryLevel: 85,
        currentLocation: {
          latitude: 60.1695,
          longitude: 24.9354
        },
        lastSeen: new Date()
      },
      {
        forkliftId: 'FL-002',
        name: 'Forklift Beta',
        model: 'Linde E20',
        currentActivity: 'IDLE',
        batteryLevel: 62,
        currentLocation: {
          latitude: 60.1699,
          longitude: 24.9352
        },
        lastSeen: new Date()
      },
      {
        forkliftId: 'FL-003',
        name: 'Forklift Gamma',
        model: 'Toyota 8FBE20U',
        currentActivity: 'WORKING',
        batteryLevel: 91,
        currentLocation: {
          latitude: 60.1692,
          longitude: 24.9361
        },
        lastSeen: new Date()
      }
    ];

    console.log('📦 Adding test forklifts...');
    const result = await collection.insertMany(testForklifts);
    console.log(`✅ Added ${result.insertedCount} test forklifts`);

    // Verify
    const count = await collection.countDocuments();
    console.log(`\n📊 Total forklifts in database: ${count}`);

    // Show the forklifts
    const forklifts = await collection.find().toArray();
    console.log('\n🚜 Forklifts in database:');
    forklifts.forEach(f => {
      console.log(`   - ${f.name} (${f.id}): ${f.activity}, Battery: ${f.battery}%`);
    });

    console.log('\n✅ Database cleaned and seeded successfully!');
    console.log('🎯 Now refresh your dashboard at http://localhost:3000');
    console.log('🌐 Test API at: http://localhost:3001/api/forklifts');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

cleanupAndSeed();
