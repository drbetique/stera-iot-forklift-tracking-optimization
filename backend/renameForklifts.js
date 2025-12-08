const mongoose = require('mongoose');
require('dotenv').config();

const Forklift = require('./src/models/Forklift');

// Forklift name mappings
const nameMapping = {
  'FL-HAMK-01': 'Victor',
  'FL-HAMK-02': 'Maryam',
  'FL-HAMK-03': 'Refat'
};

// If there's a 4th forklift, it will be named Zeeshan
const fourthForkliftName = 'Zeeshan';

async function renameForklifts() {
  try {
    // Connect to MongoDB
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all forklifts
    const forklifts = await Forklift.find().sort({ forkliftId: 1 });
    console.log(`\n📋 Found ${forklifts.length} forklifts:`);

    // Update each forklift
    for (let i = 0; i < forklifts.length; i++) {
      const forklift = forklifts[i];
      const oldName = forklift.name;

      // Determine new name
      let newName;
      if (nameMapping[forklift.forkliftId]) {
        newName = nameMapping[forklift.forkliftId];
      } else if (i === 3) {
        // Fourth forklift gets Zeeshan
        newName = fourthForkliftName;
      } else {
        // Keep existing name for any additional forklifts
        newName = forklift.name;
      }

      // Update the forklift
      forklift.name = newName;
      await forklift.save();

      console.log(`✓ ${forklift.forkliftId}: "${oldName}" → "${newName}"`);
    }

    console.log('\n🎉 All forklifts renamed successfully!');
    console.log('\n📋 Updated forklift list:');

    const updatedForklifts = await Forklift.find().sort({ forkliftId: 1 });
    updatedForklifts.forEach(f => {
      console.log(`   - ${f.forkliftId}: ${f.name}`);
    });

  } catch (error) {
    console.error('❌ Error renaming forklifts:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
  }
}

renameForklifts();
