const mongoose = require('mongoose');
const User = require('../models/User');
const crypto = require('crypto');
require('dotenv').config({ path: './config.env' });

/**
 * Migration script to add stable encryption keys to existing users
 * This fixes the issue where notes become unreadable after re-login
 */

async function migrateEncryptionKeys() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🔄 Finding users without stable encryption keys...');
    const usersWithoutKeys = await User.find({
      'encryption.salt': { $exists: true },
      'encryption.encryptionKey': { $exists: false }
    });

    console.log(`📊 Found ${usersWithoutKeys.length} users needing migration`);

    if (usersWithoutKeys.length === 0) {
      console.log('✅ No migration needed - all users already have stable encryption keys');
      return;
    }

    let updated = 0;
    for (const user of usersWithoutKeys) {
      try {
        // Generate a stable encryption key for this user
        const stableKey = crypto.randomBytes(32).toString('hex');
        
        console.log(`🔄 Updating user ${user.email} (${user._id})...`);
        
        await User.findByIdAndUpdate(user._id, {
          $set: {
            'encryption.encryptionKey': stableKey
          }
        });
        
        updated++;
        console.log(`✅ Updated user ${user.email}`);
      } catch (error) {
        console.error(`❌ Error updating user ${user.email}:`, error.message);
      }
    }

    console.log(`🎉 Migration completed! Updated ${updated} out of ${usersWithoutKeys.length} users`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  migrateEncryptionKeys().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

module.exports = migrateEncryptionKeys;
