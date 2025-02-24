const mongoose = require('mongoose');
const fetch = require('node-fetch');

/**
 * Project Schema
 * Represents a GitHub repository project
 */
const projectSchema = new mongoose.Schema({
  repositoryUrl: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: url => /^https:\/\/github\.com\/[\w-]+\/[\w.-]+$/.test(url),
      message: 'Invalid GitHub repository URL'
    }
  },
  uploadedBy: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'error', 'archived'],
    default: 'active',
    index: true
  },
  lastChecked: {
    type: Date,
    default: Date.now,
    index: true
  },
  metadata: {
    stars: Number,
    forks: Number,
    lastCommit: Date,
    language: String,
    topics: [String]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Optimized indexes
projectSchema.index({ userId: 1, status: 1, createdAt: -1 });
projectSchema.index({ status: 1, lastChecked: 1 });

/**
 * Check if metadata needs updating
 * Updates limited to every 6 hours
 */
projectSchema.methods.shouldUpdateMetadata = function() {
  if (!this.lastChecked) return true;
  const hoursSinceLastCheck = (Date.now() - this.lastChecked) / (1000 * 60 * 60);
  return hoursSinceLastCheck >= 6;
};

/**
 * Pre-save middleware
 * Validates repository URL before saving
 */
projectSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('repositoryUrl')) {
    try {
      const response = await fetch(this.repositoryUrl, {
        method: 'HEAD',
        headers: { 'User-Agent': 'BeLLa-App' }
      });
      
      if (!response.ok) {
        this.status = 'error';
      }
    } catch (error) {
      this.status = 'error';
    }
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema); 