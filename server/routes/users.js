const express = require('express');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    res.json({ user: req.user.getPublicProfile() });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching profile' });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, avatar } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (name) user.name = name;
    if (avatar) user.avatar = avatar;
    
    await user.save();
    
    res.json({ user: user.getPublicProfile() });
  } catch (error) {
    res.status(500).json({ error: 'Error updating profile' });
  }
});

// Update user preferences
router.put('/preferences', auth, async (req, res) => {
  try {
    const { theme, autoSave, autoSaveInterval } = req.body;
    
    const user = await User.findById(req.user._id);
    user.preferences = {
      ...user.preferences,
      ...(theme && { theme }),
      ...(autoSave !== undefined && { autoSave }),
      ...(autoSaveInterval && { autoSaveInterval })
    };
    
    await user.save();
    res.json({ user: user.getPublicProfile() });
  } catch (error) {
    res.status(500).json({ error: 'Error updating preferences' });
  }
});

// Change password
router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }
    
    const user = await User.findById(req.user._id);
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error changing password' });
  }
});

// Update user encryption settings
router.patch('/encryption', auth, async (req, res) => {
  try {
    const { encryption } = req.body;
    
    if (!encryption || !encryption.salt) {
      return res.status(400).json({ error: 'Encryption salt is required' });
    }
    
    const user = await User.findById(req.user._id);
    
    // Initialize encryption settings if not already present
    if (!user.encryption.salt) {
      // Generate a stable encryption key that doesn't depend on session tokens
      const crypto = require('crypto');
      const stableKey = crypto.randomBytes(32).toString('hex');
      
      user.encryption = {
        ...user.encryption,
        salt: encryption.salt,
        encryptionKey: stableKey, // Store the stable key
        algorithm: encryption.algorithm || 'AES-256-CBC',
        version: encryption.version || '1.0',
        enabled: encryption.enabled !== undefined ? encryption.enabled : true,
        created: encryption.created || new Date()
      };
      
      await user.save();
      res.json({ user: user.getPublicProfile() });
    } else {
      res.status(400).json({ error: 'Encryption already initialized' });
    }
  } catch (error) {
    console.error('Error updating encryption settings:', error);
    res.status(500).json({ error: 'Error updating encryption settings' });
  }
});

// Add stable encryption key for existing users
router.post('/encryption/stable-key', auth, async (req, res) => {
  try {
    const { encryptionKey } = req.body;
    const user = await User.findById(req.user._id);
    
    // If client provides a consistent key, use it; otherwise generate one
    let stableKey = encryptionKey;
    if (!stableKey) {
      const crypto = require('crypto');
      stableKey = crypto.randomBytes(32).toString('hex');
    }
    
    // Add stable key if user has encryption initialized but no stable key
    if (user.encryption?.salt && !user.encryption?.encryptionKey) {
      user.encryption.encryptionKey = stableKey;
      await user.save();
      
      console.log(`✅ Added stable encryption key for user ${user.email}`);
      res.json({ user: user.getPublicProfile() });
    } else if (!user.encryption?.encryptionKey) {
      // User has no encryption setup at all, initialize with the stable key
      const crypto = require('crypto');
      const salt = crypto.randomBytes(16).toString('hex');
      
      user.encryption = {
        salt: salt,
        encryptionKey: stableKey,
        algorithm: 'AES-256-CBC',
        version: '1.0',
        enabled: true,
        created: new Date()
      };
      
      await user.save();
      console.log(`✅ Initialized encryption with stable key for user ${user.email}`);
      res.json({ user: user.getPublicProfile() });
    } else {
      res.status(200).json({ 
        message: 'Stable key already exists',
        user: user.getPublicProfile()
      });
    }
  } catch (error) {
    console.error('Error adding stable encryption key:', error);
    res.status(500).json({ error: 'Error adding stable encryption key' });
  }
});

// Delete account
router.delete('/account', auth, async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Password is required to delete account' });
    }
    
    const user = await User.findById(req.user._id);
    
    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Password is incorrect' });
    }
    
    // Deactivate account instead of deleting
    user.isActive = false;
    await user.save();
    
    res.json({ message: 'Account deactivated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deactivating account' });
  }
});

module.exports = router; 