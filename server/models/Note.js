const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: {
    type: mongoose.Schema.Types.Mixed, // Can be string or encrypted object
    required: true,
    default: 'Untitled Note'
  },
  content: {
    type: mongoose.Schema.Types.Mixed, // Can be string or encrypted object
    default: ''
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: mongoose.Schema.Types.Mixed // Can be string or encrypted object
  }],
  _encrypted: {
    type: Boolean,
    default: false
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  shareLink: {
    type: String,
    unique: true,
    sparse: true
  },
  wordCount: {
    type: Number,
    default: 0
  },
  characterCount: {
    type: Number,
    default: 0
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  version: {
    type: Number,
    default: 1
  },
  history: [{
    content: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    version: Number
  }],
  metadata: {
    fontSize: {
      type: Number,
      default: 16
    },
    fontFamily: {
      type: String,
      default: 'Arial, sans-serif'
    },
    lineHeight: {
      type: Number,
      default: 1.5
    },
    textAlign: {
      type: String,
      enum: ['left', 'center', 'right', 'justify'],
      default: 'left'
    }
  }
}, {
  timestamps: true
});

// Index for better query performance
noteSchema.index({ user: 1, createdAt: -1 });
noteSchema.index({ user: 1, isFavorite: 1 });
noteSchema.index({ user: 1, isArchived: 1 });
noteSchema.index({ shareLink: 1 });

// Pre-save middleware to update word and character count
noteSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    // Handle encrypted content - skip word/character count calculation
    if (this._encrypted && typeof this.content === 'object') {
      // For encrypted content, we can't calculate word count
      this.wordCount = 0;
      this.characterCount = 0;
    } else {
      // For unencrypted content, calculate normally
      const contentText = typeof this.content === 'string' ? this.content : '';
      this.wordCount = contentText.trim() ? contentText.trim().split(/\s+/).length : 0;
      this.characterCount = contentText.length;
    }
    
    this.lastModified = new Date();
    this.version += 1;
    
    // Add to history (keep last 10 versions) - store encrypted content as-is
    this.history.push({
      content: this.content,
      timestamp: new Date(),
      version: this.version
    });
    
    if (this.history.length > 10) {
      this.history.shift();
    }
  }
  next();
});

// Method to generate share link
noteSchema.methods.generateShareLink = function() {
  const crypto = require('crypto');
  this.shareLink = crypto.randomBytes(16).toString('hex');
  return this.shareLink;
};

// Method to get public note data
noteSchema.methods.getPublicData = function() {
  const noteObject = this.toObject();
  delete noteObject.user;
  delete noteObject.history;
  return noteObject;
};

// Static method to search notes
noteSchema.statics.searchNotes = function(userId, query) {
  // For encrypted notes, we can only search by non-encrypted fields
  // Note: Title, content, and tags might be encrypted, so search might be limited
  return this.find({
    user: userId,
    $or: [
      // Try to search in unencrypted fields
      { _encrypted: { $ne: true }, title: { $regex: query, $options: 'i' } },
      { _encrypted: { $ne: true }, content: { $regex: query, $options: 'i' } },
      { _encrypted: { $ne: true }, tags: { $in: [new RegExp(query, 'i')] } },
      // Also search in metadata that's never encrypted
      { 'metadata.notes': { $regex: query, $options: 'i' } }
    ]
  }).sort({ lastModified: -1 });
};

module.exports = mongoose.model('Note', noteSchema); 