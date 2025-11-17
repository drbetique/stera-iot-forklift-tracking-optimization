const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

/**
 * Seed script to create default users for Stera IoT Forklift Tracking system
 * Creates three default users: Admin, Operator, and Viewer
 *
 * Usage: npm run seed:users
 */

// Default users configuration
const defaultUsers = [
  {
    username: 'admin',
    email: 'admin@stera.com',
    password: 'Admin@123',
    role: 'admin',
    fullName: 'System Administrator',
    isActive: true
  },
  {
    username: 'operator',
    email: 'operator@stera.com',
    password: 'Operator@123',
    role: 'operator',
    fullName: 'Fleet Operator',
    isActive: true
  },
  {
    username: 'viewer',
    email: 'viewer@stera.com',
    password: 'Viewer@123',
    role: 'viewer',
    fullName: 'Fleet Viewer',
    isActive: true
  }
];

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

/**
 * Seed users
 */
const seedUsers = async () => {
  try {
    console.log('Starting user seeding process...\n');

    // Clear existing users (optional - comment out if you want to keep existing users)
    // await User.deleteMany({});
    // console.log('Existing users cleared\n');

    // Create each user
    for (const userData of defaultUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ username: userData.username }, { email: userData.email }]
      });

      if (existingUser) {
        console.log(`⚠️  User "${userData.username}" already exists - skipping`);
        continue;
      }

      // Validate password strength
      const passwordValidation = User.validatePasswordStrength(userData.password);
      if (!passwordValidation.isValid) {
        console.error(`❌ Password validation failed for ${userData.username}: ${passwordValidation.message}`);
        continue;
      }

      // Create user
      const user = new User(userData);
      await user.save();

      console.log(`✅ Created user: ${userData.username} (${userData.role}) - ${userData.email}`);
    }

    console.log('\n✨ User seeding completed successfully!');
    console.log('\n📝 Default Login Credentials:');
    console.log('━'.repeat(60));
    console.log('\n👤 Admin User:');
    console.log('   Username: admin');
    console.log('   Password: Admin@123');
    console.log('   Permissions: Full access (view, create, edit, delete)');

    console.log('\n👤 Operator User:');
    console.log('   Username: operator');
    console.log('   Password: Operator@123');
    console.log('   Permissions: View and edit forklifts and stations');

    console.log('\n👤 Viewer User:');
    console.log('   Username: viewer');
    console.log('   Password: Viewer@123');
    console.log('   Permissions: Read-only access');

    console.log('\n━'.repeat(60));
    console.log('\n⚠️  IMPORTANT: Change these passwords in production!\n');

  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
};

/**
 * Main execution
 */
const main = async () => {
  try {
    await connectDB();
    await seedUsers();

    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
};

// Run the script
main();
