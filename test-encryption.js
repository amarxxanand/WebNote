const CryptoJS = require('crypto-js');

// Test the encryption/decryption process
console.log('🔐 Testing WebNote Encryption System\n');

// Simulate the encryption functions
const generateSalt = () => {
  return CryptoJS.lib.WordArray.random(128/8).toString();
};

const deriveKey = (userSecret, salt, iterations = 100000) => {
  return CryptoJS.PBKDF2(userSecret, salt, {
    keySize: 256/32,
    iterations: iterations
  });
};

const generateIV = () => {
  return CryptoJS.lib.WordArray.random(128/8);
};

const encryptText = (plaintext, userSecret, salt) => {
  if (!plaintext || typeof plaintext !== 'string') {
    return null;
  }

  try {
    const key = deriveKey(userSecret, salt);
    const iv = generateIV();
    
    const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    const hmac = CryptoJS.HmacSHA256(encrypted.ciphertext.toString() + iv.toString(), key);

    return {
      ciphertext: encrypted.ciphertext.toString(),
      iv: iv.toString(),
      hmac: hmac.toString(),
      salt: salt,
      algorithm: 'AES-256-CBC',
      version: '1.0'
    };
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
};

const decryptText = (encryptedData, userSecret) => {
  if (!encryptedData || typeof encryptedData !== 'object') {
    return '';
  }

  try {
    const { ciphertext, iv, hmac, salt } = encryptedData;
    
    if (!ciphertext || !iv || !salt) {
      throw new Error('Invalid encrypted data format');
    }

    const key = deriveKey(userSecret, salt);
    
    // Verify HMAC
    const expectedHmac = CryptoJS.HmacSHA256(ciphertext + iv, key);
    if (hmac !== expectedHmac.toString()) {
      throw new Error('HMAC verification failed');
    }
    
    const cipher = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Hex.parse(ciphertext)
    });

    const decrypted = CryptoJS.AES.decrypt(cipher, key, {
      iv: CryptoJS.enc.Hex.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedText) {
      throw new Error('Decryption failed');
    }

    return decryptedText;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw error;
  }
};

// Test data
const testData = {
  title: "My Secret Note",
  content: "This is very sensitive information that needs to be encrypted!"
};

const userSecret = "user123:stablekey456";
const salt = generateSalt();

console.log('📝 Original Data:');
console.log('Title:', testData.title);
console.log('Content:', testData.content);
console.log('Content Length:', testData.content.length);

console.log('\n🔐 Encrypting...');
const encryptedTitle = encryptText(testData.title, userSecret, salt);
const encryptedContent = encryptText(testData.content, userSecret, salt);

console.log('Encrypted Title Object Keys:', Object.keys(encryptedTitle));
console.log('Encrypted Content Object Keys:', Object.keys(encryptedContent));
console.log('Encrypted Title Ciphertext (first 20 chars):', encryptedTitle.ciphertext.substring(0, 20) + '...');

console.log('\n🔓 Decrypting...');
const decryptedTitle = decryptText(encryptedTitle, userSecret);
const decryptedContent = decryptText(encryptedContent, userSecret);

console.log('Decrypted Title:', decryptedTitle);
console.log('Decrypted Content:', decryptedContent);
console.log('Decrypted Content Length:', decryptedContent.length);

console.log('\n✅ Test Results:');
console.log('Title Match:', testData.title === decryptedTitle ? 'PASS' : 'FAIL');
console.log('Content Match:', testData.content === decryptedContent ? 'PASS' : 'FAIL');
console.log('Content Length Match:', testData.content.length === decryptedContent.length ? 'PASS' : 'FAIL');

// Test MongoDB storage simulation
console.log('\n💾 MongoDB Storage Simulation:');
const mongoDoc = {
  _id: '507f1f77bcf86cd799439011',
  title: encryptedTitle,
  content: encryptedContent,
  _encrypted: true,
  userId: 'user123',
  createdAt: new Date(),
  updatedAt: new Date()
};

console.log('Document stored in MongoDB:');
console.log('- Title type:', typeof mongoDoc.title);
console.log('- Content type:', typeof mongoDoc.content);
console.log('- Encrypted flag:', mongoDoc._encrypted);

// Simulate retrieval and decryption
console.log('\n📥 MongoDB Retrieval & Decryption:');
const retrievedDoc = JSON.parse(JSON.stringify(mongoDoc)); // Simulate JSON round-trip
const finalTitle = decryptText(retrievedDoc.title, userSecret);
const finalContent = decryptText(retrievedDoc.content, userSecret);

console.log('Final decrypted title:', finalTitle);
console.log('Final decrypted content:', finalContent);
console.log('Final content length:', finalContent.length);

console.log('\n🏆 End-to-End Test Results:');
console.log('Round-trip Title Match:', testData.title === finalTitle ? 'PASS ✅' : 'FAIL ❌');
console.log('Round-trip Content Match:', testData.content === finalContent ? 'PASS ✅' : 'FAIL ❌');
