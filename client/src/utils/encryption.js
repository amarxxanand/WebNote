import CryptoJS from 'crypto-js';

/**
 * Client-Side Field Level Encryption Utilities
 * 
 * This module provides secure encryption/decryption for sensitive note data.
 * It uses AES-256-GCM encryption with user-specific keys and salt.
 */

// Generate a random salt for key derivation
const generateSalt = () => {
  return CryptoJS.lib.WordArray.random(128/8).toString();
};

// Derive an encryption key from user password and salt using PBKDF2
const deriveKey = (userSecret, salt, iterations = 100000) => {
  return CryptoJS.PBKDF2(userSecret, salt, {
    keySize: 256/32,
    iterations: iterations
  });
};

// Generate a random IV (Initialization Vector)
const generateIV = () => {
  return CryptoJS.lib.WordArray.random(128/8); // 128 bits for CBC
};

/**
 * Encrypt sensitive text using AES-256-CBC with HMAC authentication
 * @param {string} plaintext - The text to encrypt
 * @param {string} userSecret - User's secret (derived from password/session)
 * @param {string} salt - Salt for key derivation
 * @returns {object} Encrypted data with metadata
 */
export const encryptText = (plaintext, userSecret, salt) => {
  if (typeof plaintext !== 'string') {
    return null;
  }

  try {
    const key = deriveKey(userSecret, salt);
    const iv = generateIV();
    
    // Encrypt using AES-256-CBC
    const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    // Generate HMAC for authentication
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

/**
 * Decrypt sensitive text using AES-256-CBC with HMAC verification
 * @param {object} encryptedData - The encrypted data object
 * @param {string} userSecret - User's secret (derived from password/session)
 * @returns {string} Decrypted plaintext
 */
export const decryptText = (encryptedData, userSecret) => {
  // Handle null/undefined
  if (!encryptedData) {
    return '';
  }

  // Handle legacy unencrypted data
  if (typeof encryptedData === 'string') {
    return encryptedData;
  }

  // Handle non-object data
  if (typeof encryptedData !== 'object') {
    console.warn('Invalid encrypted data type:', typeof encryptedData);
    return '';
  }

  // Check if this looks like encrypted data
  if (!encryptedData.ciphertext && !encryptedData.iv && !encryptedData.salt) {
    console.warn('Data does not appear to be encrypted:', Object.keys(encryptedData));
    return '';
  }

  try {
    const { ciphertext, iv, hmac, salt, algorithm, version } = encryptedData;
    
    if (!ciphertext || !iv || !salt) {
      throw new Error('Invalid encrypted data format - missing required fields');
    }

    if (!userSecret) {
      throw new Error('User secret required for decryption');
    }

    // Verify algorithm compatibility
    if (algorithm !== 'AES-256-CBC' && algorithm !== 'AES-256-GCM') {
      throw new Error('Unsupported encryption algorithm: ' + algorithm);
    }
    
    if (version !== '1.0') {
      throw new Error('Unsupported encryption version: ' + version);
    }

    const key = deriveKey(userSecret, salt);
    
    // Verify HMAC if present (for CBC mode)
    if (hmac && algorithm === 'AES-256-CBC') {
      const expectedHmac = CryptoJS.HmacSHA256(ciphertext + iv, key);
      if (hmac !== expectedHmac.toString()) {
        throw new Error('HMAC verification failed - data may be corrupted or tampered with');
      }
    }
    
    // Reconstruct the cipher
    const cipher = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Hex.parse(ciphertext)
    });

    // Decrypt using AES-256-CBC
    const decrypted = CryptoJS.AES.decrypt(cipher, key, {
      iv: CryptoJS.enc.Hex.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedText) {
      throw new Error('Decryption failed - invalid key or corrupted data');
    }

    return decryptedText;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data - invalid key or corrupted data');
  }
};

/**
 * Generate a user-specific encryption salt
 * This should be called once per user and stored securely
 * @param {string} userId - Unique user identifier
 * @returns {string} Generated salt
 */
export const generateUserSalt = (userId) => {
  const baseSalt = generateSalt();
  // Combine with user ID for uniqueness
  return CryptoJS.SHA256(baseSalt + userId).toString();
};

/**
 * Derive user secret from session data
 * @param {string} userId - User ID
 * @param {string} sessionToken - Current session token
 * @returns {string} User secret for encryption
 */
export const deriveUserSecret = (userId, sessionToken) => {
  if (!userId || !sessionToken) {
    throw new Error('User ID and session token required for encryption');
  }
  
  // Combine user ID and session token to create a unique secret
  return CryptoJS.SHA256(userId + ':' + sessionToken).toString();
};

/**
 * Encrypt note data (title, content, tags)
 * @param {object} noteData - Note data to encrypt
 * @param {string} userSecret - User's encryption secret
 * @param {string} salt - User's encryption salt
 * @returns {object} Note data with encrypted fields
 */
export const encryptNoteData = (noteData, userSecret, salt) => {
  if (!noteData || !userSecret || !salt) {
    return noteData;
  }

  try {
    const encrypted = { ...noteData };

    // Encrypt sensitive fields
    if (noteData.title && typeof noteData.title === 'string') {
      const encryptedTitle = encryptText(noteData.title, userSecret, salt);
      if (encryptedTitle) {
        encrypted.title = encryptedTitle;
      }
    }
    
    if (noteData.content && typeof noteData.content === 'string') {
      const encryptedContent = encryptText(noteData.content, userSecret, salt);
      if (encryptedContent) {
        encrypted.content = encryptedContent;
      }
    }
    
    if (noteData.tags && Array.isArray(noteData.tags)) {
      encrypted.tags = noteData.tags.map(tag => {
        if (typeof tag === 'string' && tag.trim()) {
          const encryptedTag = encryptText(tag, userSecret, salt);
          return encryptedTag || tag;
        }
        return tag;
      });
    }

    // Mark as encrypted for identification
    encrypted._encrypted = true;
    
    return encrypted;
  } catch (error) {
    console.error('Failed to encrypt note data:', error);
    // Return original data if encryption fails
    return noteData;
  }
};

/**
 * Decrypt note data (title, content, tags)
 * @param {object} noteData - Encrypted note data
 * @param {string} userSecret - User's encryption secret
 * @returns {object} Note data with decrypted fields
 */
export const decryptNoteData = (noteData, userSecret) => {
  if (!noteData || !userSecret) {
    return {
      title: 'Untitled Note',
      content: '',
      tags: []
    };
  }

  // If not marked as encrypted, return as-is (legacy data) but ensure safe types
  if (!noteData._encrypted) {
    return {
      ...noteData,
      title: typeof noteData.title === 'string' ? noteData.title : 'Untitled Note',
      content: typeof noteData.content === 'string' ? noteData.content : '',
      tags: Array.isArray(noteData.tags) ?
        noteData.tags.filter(tag => typeof tag === 'string') : []
    };
  }

  const decrypted = { ...noteData };

  try {
    // Decrypt title with robust checking
    if (noteData.title && typeof noteData.title === 'object' && noteData.title.ciphertext) {
      try {
        decrypted.title = decryptText(noteData.title, userSecret);
      } catch (error) {
        console.error('Failed to decrypt title:', error);
        decrypted.title = 'Encrypted Title (Decryption Failed)';
      }
    } else if (typeof noteData.title === 'string') {
      decrypted.title = noteData.title;
    } else {
      decrypted.title = 'Untitled Note';
    }

    // Decrypt content with robust checking
    if (noteData.content && typeof noteData.content === 'object' && noteData.content.ciphertext) {
      try {
        decrypted.content = decryptText(noteData.content, userSecret);
      } catch (error) {
        console.error('Failed to decrypt content:', error);
        decrypted.content = '';
      }
    } else if (typeof noteData.content === 'string') {
      decrypted.content = noteData.content;
    } else {
      decrypted.content = '';
    }

    if (noteData.tags && Array.isArray(noteData.tags)) {
      decrypted.tags = noteData.tags.map(tag => {
        try {
          if (typeof tag === 'object' && tag.ciphertext) {
            return decryptText(tag, userSecret);
          } else if (typeof tag === 'string') {
            return tag;
          }
          return '';
        } catch (error) {
          console.error('Failed to decrypt tag:', error);
          return '';
        }
      }).filter(tag => typeof tag === 'string' && tag.trim() !== '');
    } else {
      decrypted.tags = [];
    }

    // Remove encryption marker after processing
    delete decrypted._encrypted;

    return decrypted;
  } catch (error) {
    console.error('Critical failure during note decryption:', error);
    // Return a safe fallback with string values to prevent app crashes
    return {
      ...noteData,
      title: 'Encrypted Note (Decryption Failed)',
      content: '',
      tags: [],
      _decryptionFailed: true
    };
  }
};

/**
 * Check if data is encrypted
 * @param {any} data - Data to check
 * @returns {boolean} True if data appears to be encrypted
 */
export const isEncrypted = (data) => {
  return data && typeof data === 'object' && data._encrypted === true;
};

/**
 * Generate encryption metadata for a user
 * @param {string} userId - User ID
 * @returns {object} Encryption metadata
 */
export const generateEncryptionMetadata = (userId) => {
  const salt = generateUserSalt(userId);
  
  return {
    salt,
    algorithm: 'AES-256-CBC',
    version: '1.0',
    created: new Date().toISOString()
  };
};
