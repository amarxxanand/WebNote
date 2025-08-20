const mongoose = require('mongoose');
const Note = require('../models/Note');

// Load environment variables - check both .env and config.env
const fs = require('fs');
const path = require('path');

if (fs.existsSync(path.join(__dirname, '../.env'))) {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
} else if (fs.existsSync(path.join(__dirname, '../config.env'))) {
  require('dotenv').config({ path: path.join(__dirname, '../config.env') });
}

console.log('Environment loaded, MONGO_URI available:', !!process.env.MONGO_URI);
console.log('Environment loaded, MONGODB_URI available:', !!process.env.MONGODB_URI);

// Connect to MongoDB - try both MONGO_URI and MONGODB_URI
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
console.log('Using MongoDB URI:', !!mongoUri);

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function fixEncryptionFlags() {
  console.log('🔧 Starting encryption flag fix...');
  
  try {
    // Find all notes that have encrypted data but don't have the _encrypted flag set properly
    const notes = await Note.find({});
    
    console.log(`Found ${notes.length} notes to check...`);
    
    let fixedCount = 0;
    
    for (const note of notes) {
      let needsUpdate = false;
      const updateData = {};
      
      // Check if note has encrypted data (title, content, or tags as objects with ciphertext)
      const hasEncryptedTitle = note.title && typeof note.title === 'object' && note.title.ciphertext;
      const hasEncryptedContent = note.content && typeof note.content === 'object' && note.content.ciphertext;
      const hasEncryptedTags = Array.isArray(note.tags) && note.tags.some(tag => 
        tag && typeof tag === 'object' && tag.ciphertext
      );
      
      const hasEncryptedData = hasEncryptedTitle || hasEncryptedContent || hasEncryptedTags;
      
      if (hasEncryptedData && !note._encrypted) {
        console.log(`📝 Note ${note._id} has encrypted data but _encrypted flag is ${note._encrypted}`);
        updateData._encrypted = true;
        needsUpdate = true;
      } else if (!hasEncryptedData && note._encrypted) {
        console.log(`📝 Note ${note._id} has no encrypted data but _encrypted flag is ${note._encrypted}`);
        updateData._encrypted = false;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await Note.findByIdAndUpdate(note._id, updateData);
        fixedCount++;
        console.log(`✅ Fixed note ${note._id} - set _encrypted to ${updateData._encrypted}`);
      }
    }
    
    console.log(`🎉 Encryption flag fix complete! Fixed ${fixedCount} notes.`);
    
    // Verify the fix
    const encryptedNotes = await Note.find({ _encrypted: true });
    const unencryptedNotes = await Note.find({ _encrypted: { $ne: true } });
    
    console.log(`\n📊 Final count:`);
    console.log(`   Encrypted notes: ${encryptedNotes.length}`);
    console.log(`   Unencrypted notes: ${unencryptedNotes.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing encryption flags:', error);
    process.exit(1);
  }
}

// Run the fix
fixEncryptionFlags();
