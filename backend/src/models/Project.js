const mongoose = require('mongoose');
const { Octokit } = require('octokit');

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
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
      
      // Use GitHub API to validate repository
      const { data } = await octokit.rest.repos.get({
        owner,
        repo: repo.replace('.git', '')
      });

      // Update metadata
      this.metadata = {
        stars: data.stargazers_count,
        forks: data.forks_count,
        lastCommit: data.pushed_at,
        language: data.language,
        topics: data.topics || []
      };
      this.status = 'active';

    } catch (error) {
      console.error('Error validating repository:', error);
      this.status = 'error';
      this.metadata = { 
        ...this.metadata, 
        error: error.status === 404 ? 'Repository not found' : 'Failed to validate repository'
      };
    }
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema); 