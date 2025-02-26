const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { AUTH_CONFIG } = require('../config/config');
const logger = require('../services/logService');

/**
 * User Schema
 * Optimized for performance and memory usage
 */
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    index: true // Explicit index
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    maxlength: 254, // RFC 5321
    validate: {
      validator: email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
      message: 'Invalid email format'
    },
    index: true // Explicit index
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false
  },
  githubId: {
    type: String,
    sparse: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
    index: true // For role-based queries
  },
  lastLogin: {
    type: Date,
    default: Date.now,
    expires: 7776000 // 90 days TTL index
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true // For active user queries
  }
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    transform: (doc, ret) => {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

// Compound indexes for common queries
userSchema.index({ username: 1, isActive: 1 });
userSchema.index({ email: 1, isActive: 1 });
userSchema.index({ githubId: 1, isActive: 1 }, { sparse: true, unique: true });

// Pre-save middleware
userSchema.pre('save', async function(next) {
  try {
    // Only hash password if it's modified
    if (!this.isModified('password')) return next();
    
    // Generate salt with minimum rounds for performance
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance methods
userSchema.methods = {
  // Compare password
  comparePassword: async function(candidatePassword) {
    try {
      return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
      throw new Error('Password comparison failed');
    }
  },

  // Update last login with minimal fields
  updateLastLogin: async function() {
    try {
      await this.model('User').findByIdAndUpdate(
        this._id,
        { lastLogin: new Date() },
        { new: true, select: 'lastLogin' }
      );
    } catch (error) {
      logger.error('Failed to update last login:', error);
    }
  }
};

// Static methods
userSchema.statics = {
  // Find active user by ID
  findActiveById: async function(id) {
    return this.findOne({ _id: id, isActive: true })
      .select('-password')
      .lean()
      .exec();
  },

  // Find by GitHub ID
  findByGithubId: async function(githubId) {
    return this.findOne({ githubId, isActive: true })
      .select('-password')
      .lean()
      .exec();
  }
};

// Create model
const User = mongoose.model('User', userSchema);

// Create indexes with error handling
const createIndexes = async () => {
  try {
    // Drop existing indexes first
    await User.collection.dropIndexes();
    
    // Create new indexes
    await Promise.all([
      User.collection.createIndex({ username: 1 }, { unique: true }),
      User.collection.createIndex({ email: 1 }, { unique: true }),
      User.collection.createIndex({ githubId: 1 }, { unique: true, sparse: true }),
      User.collection.createIndex({ role: 1 }),
      User.collection.createIndex({ lastLogin: 1 }, { expireAfterSeconds: 7776000 }),
      User.collection.createIndex({ isActive: 1 }),
      User.collection.createIndex({ username: 1, isActive: 1 }),
      User.collection.createIndex({ email: 1, isActive: 1 }),
      User.collection.createIndex({ githubId: 1, isActive: 1 }, { sparse: true })
    ]);
    logger.info('User indexes created successfully');
  } catch (error) {
    // Log error but don't throw - allow application to continue
    logger.error('Error managing user indexes:', error);
  }
};

// Initialize indexes
createIndexes();

module.exports = User; 