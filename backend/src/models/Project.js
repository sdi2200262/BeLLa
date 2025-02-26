const mongoose = require('mongoose');
const { Octokit } = require('octokit');
const { AUTH_CONFIG, PROJECT_LIMITS } = require('../config/config');
const logger = require('../services/logService');
const cacheService = require('../services/cacheService');

// Initialize Octokit with config
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  request: {
    timeout: AUTH_CONFIG.GITHUB.API_TIMEOUT
  }
});

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
    enum: ['active', 'error'],
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
    topics: [String],
    error: String
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
 * Validates repository URL before saving using GitHub API
 */
projectSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('repositoryUrl')) {
    try {
      // Extract owner and repo from URL
      const match = this.repositoryUrl.match(/github\.com\/([^\/]+)\/([^\/\s]+)/);
      if (!match) {
        this.status = 'error';
        this.metadata = { ...this.metadata, error: 'Invalid GitHub repository URL format' };
        return next();
      }

      const [_, owner, repo] = match;
      const repoName = repo.replace('.git', '');
      
      // Check cache first
      const cacheKey = `repo:${owner}/${repoName}`;
      const cachedData = cacheService.get('github', cacheKey);
      
      if (cachedData) {
        this.metadata = cachedData;
        this.status = 'active';
        this.lastChecked = new Date();
        return next();
      }
      
      // Use GitHub API to validate repository with retry logic
      let retries = AUTH_CONFIG.GITHUB.MAX_RETRIES;
      let success = false;
      
      while (retries > 0 && !success) {
        try {
          const { data } = await octokit.rest.repos.get({
            owner,
            repo: repoName
          });
          
          // Update metadata
          this.metadata = {
            stars: data.stargazers_count,
            forks: data.forks_count,
            lastCommit: data.pushed_at,
            language: data.language,
            topics: data.topics || []
          };
          
          // Cache the result
          cacheService.set('github', cacheKey, this.metadata);
          
          this.status = 'active';
          this.lastChecked = new Date();
          success = true;
        } catch (error) {
          retries--;
          if (retries === 0) {
            throw error;
          }
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * (AUTH_CONFIG.GITHUB.MAX_RETRIES - retries)));
        }
      }
    } catch (error) {
      logger.error('Error validating repository:', error);
      this.status = 'error';
      this.metadata = { 
        ...this.metadata, 
        error: error.status === 404 ? 'Repository not found' : 'Failed to validate repository'
      };
    }
  }
  next();
});

// Static method to check user project limits
projectSchema.statics.checkUserLimit = async function(userId) {
  const count = await this.countDocuments({
    userId
  });
  
  return {
    current: count,
    limit: PROJECT_LIMITS.PROJECTS_PER_USER,
    remaining: Math.max(0, PROJECT_LIMITS.PROJECTS_PER_USER - count),
    exceeded: count >= PROJECT_LIMITS.PROJECTS_PER_USER
  };
};

module.exports = mongoose.model('Project', projectSchema); 