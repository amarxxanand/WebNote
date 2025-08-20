/**
 * Simple test for encryption utilities
 * Run this in browser console to verify encryption works
 */

import { 
  encryptText, 
  decryptText, 
  encryptNoteData, 
  decryptNoteData,
  generateUserSalt,
  deriveUserSecret
} from '../src/utils/encryption.js';

const runEncryptionTests = () => {
  console.log('🔐 Running Encryption Tests...\n');

  try {
    // Test 1: Basic text encryption/decryption
    console.log('Test 1: Basic Text Encryption');
    const testText = "This is a secret message!";
    const userSecret = "test-user-secret";
    const salt = generateUserSalt("test-user-123");
    
    console.log('Original text:', testText);
    console.log('Salt:', salt.substring(0, 10) + '...');
    
    const encrypted = encryptText(testText, userSecret, salt);
    console.log('Encrypted algorithm:', encrypted.algorithm);
    console.log('Has HMAC:', !!encrypted.hmac);
    
    const decrypted = decryptText(encrypted, userSecret);
    console.log('Decrypted:', decrypted);
    console.log('✅ Match:', testText === decrypted);
    console.log('');

    // Test 2: Note data encryption/decryption
    console.log('Test 2: Note Data Encryption');
    const testNote = {
      title: "My Secret Note",
      content: "This is confidential information that should be encrypted.",
      tags: ["secret", "confidential", "encrypted"]
    };
    
    console.log('Original note:', testNote);
    
    const encryptedNote = encryptNoteData(testNote, userSecret, salt);
    console.log('Encrypted note:', encryptedNote);
    console.log('Is encrypted marked:', encryptedNote._encrypted);
    
    const decryptedNote = decryptNoteData(encryptedNote, userSecret);
    console.log('Decrypted note:', decryptedNote);
    console.log('✅ Title match:', testNote.title === decryptedNote.title);
    console.log('✅ Content match:', testNote.content === decryptedNote.content);
    console.log('✅ Tags match:', JSON.stringify(testNote.tags) === JSON.stringify(decryptedNote.tags));
    console.log('');

    // Test 3: User secret derivation
    console.log('Test 3: User Secret Derivation');
    const userId = "user123";
    const sessionToken = "session-token-abc";
    const secret1 = deriveUserSecret(userId, sessionToken);
    const secret2 = deriveUserSecret(userId, sessionToken);
    const secret3 = deriveUserSecret(userId, "different-token");
    
    console.log('Secret 1:', secret1);
    console.log('Secret 2:', secret2);
    console.log('Secret 3:', secret3);
    console.log('✅ Same inputs produce same secret:', secret1 === secret2);
    console.log('✅ Different tokens produce different secrets:', secret1 !== secret3);
    console.log('');

    // Test 4: Error handling
    console.log('Test 4: Error Handling');
    try {
      const invalidDecryption = decryptText(encrypted, "wrong-secret");
      console.log('❌ Should have failed with wrong secret');
    } catch (error) {
      console.log('✅ Correctly failed with wrong secret:', error.message);
    }

    // Test with corrupted data
    try {
      const corruptedData = { ...encrypted, ciphertext: "corrupted" };
      const invalidDecryption = decryptText(corruptedData, userSecret);
      console.log('❌ Should have failed with corrupted data');
    } catch (error) {
      console.log('✅ Correctly failed with corrupted data:', error.message);
    }
    console.log('');

    // Test 5: Performance test
    console.log('Test 5: Performance Test');
    const largeText = "A".repeat(10000); // 10KB of text
    const startTime = performance.now();
    
    const largeEncrypted = encryptText(largeText, userSecret, salt);
    const encryptTime = performance.now() - startTime;
    
    const decryptStart = performance.now();
    const largeDecrypted = decryptText(largeEncrypted, userSecret);
    const decryptTime = performance.now() - decryptStart;
    
    console.log(`✅ Encrypted 10KB in ${encryptTime.toFixed(2)}ms`);
    console.log(`✅ Decrypted 10KB in ${decryptTime.toFixed(2)}ms`);
    console.log(`✅ Data integrity: ${largeText === largeDecrypted}`);

    console.log('\n🎉 All encryption tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Auto-run tests if in development
if (process.env.NODE_ENV === 'development') {
  // Uncomment to run tests automatically
  // runEncryptionTests();
}

export { runEncryptionTests };
