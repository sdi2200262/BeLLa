const mongoose = require('mongoose');

/**
 * User Schema
 * Simplified model that only stores GitHub OAuth information
 * No sensitive data or passwords are stored
 */
const userSchema = new mongoose.Schema({
  // GitHub ID serves as the primary identifier
  githubId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  
  // Last login timestamp
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

/**
 * Update last login timestamp
 */
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = Date.now();
  return this.save();
};

// Create and export the model
module.exports = mongoose.model('User', userSchema); 