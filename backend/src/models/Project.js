const mongoose = require('mongoose');

/**
 * Project Schema
 * Simplified model that only stores essential information
 * All project data is fetched from GitHub API when needed
 */
const projectSchema = new mongoose.Schema({
  // GitHub repository URL serves as the unique identifier
  repositoryUrl: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: url => /^https:\/\/github\.com\/[\w-]+\/[\w.-]+$/.test(url),
      message: 'Invalid GitHub repository URL'
    },
    index: true
  },
  
  // GitHub username of the user who added this project
  githubUsername: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  // Timestamp for caching purposes
  lastChecked: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
projectSchema.index({ githubUsername: 1, createdAt: -1 });

/**
 * Check if GitHub data needs refreshing
 * Only fetch new data from GitHub API after 30 minutes
 */
projectSchema.methods.shouldRefreshData = function() {
  if (!this.lastChecked) return true;
  const minutesSinceLastCheck = (Date.now() - this.lastChecked) / (1000 * 60);
  return minutesSinceLastCheck >= 30; // Refresh after 30 minutes
};

/**
 * Extract owner and repo from GitHub URL
 */
projectSchema.methods.parseRepoUrl = function() {
  const match = this.repositoryUrl.match(/github\.com\/([^\/]+)\/([^\/\s]+)/);
  if (!match) return null;
  
  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/, '')
  };
};

// Create and export the model
module.exports = mongoose.model('Project', projectSchema); 