const mongoose = require('mongoose');
const User = require('../models/User');
const Note = require('../models/Note');

/**
 * Migration script to add encryption metadata to existing users
 * and mark existing notes as unencrypted for backward compatibility
 */

const migrateToEncryption = async () => {
  try {
    console.log('Starting encryption migration...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/webnote');
    
    // Update existing users to have encryption disabled by default
    const userUpdateResult = await User.updateMany(
      { 'encryption.enabled': { $exists: false } },
      { 
        $set: { 
          'encryption.enabled': true,
          'encryption.algorithm': 'AES-256-CBC',
          'encryption.version': '1.0'
        } 
      }
    );
    
    console.log(`Updated ${userUpdateResult.modifiedCount} users with encryption settings`);
    
    // Mark existing notes as unencrypted
    const noteUpdateResult = await Note.updateMany(
      { _encrypted: { $exists: false } },
      { $set: { _encrypted: false } }
    );
    
    console.log(`Marked ${noteUpdateResult.modifiedCount} existing notes as unencrypted`);
    
    console.log('Migration completed successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

// Run migration if called directly
if (require.main === module) {
  migrateToEncryption();
}

module.exports = migrateToEncryption;
