const mongoose = require('mongoose');
const { Octokit } = require('octokit');

/**
 * Factory function to create Octokit instance with caching
 * This ensures the token is loaded from environment variables
 * and implements a simple in-memory cache for GitHub API responses
 */
const githubCache = new Map();
const CACHE_TTL = 3600000; // 1 hour in milliseconds

const getOctokit = () => {
  return new Octokit({
    auth: process.env.GITHUB_TOKEN
  });
};

/**
 * Fetch repository data with caching
 * @param {String} owner - Repository owner
 * @param {String} repo - Repository name
 * @returns {Promise<Object>} Repository data
 */
const fetchRepositoryWithCache = async (owner, repo) => {
  const cacheKey = `${owner}/${repo}`;
  const cachedData = githubCache.get(cacheKey);
  
  // Return cached data if valid
  if (cachedData && (Date.now() - cachedData.timestamp < CACHE_TTL)) {
    return cachedData.data;
  }
  
  // Fetch fresh data
  const octokit = getOctokit();
  const { data } = await octokit.rest.repos.get({
    owner,
    repo,
    request: {
      timeout: 5000 // 5 second timeout
    }
  });
  
  // Cache the result
  githubCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
  
  return data;
};

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
      validator: url => {
        // Enhanced regex to handle more GitHub URL formats
        return /^https?:\/\/(?:www\.)?github\.com\/[\w.-]+\/[\w.-]+(?:\.git)?(?:\/?|\#[\w-\.]+)?$/.test(url);
      },
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
  lastChecked: {
    type: Date,
    default: Date.now
  },
  metadata: {
    stars: Number,
    forks: Number,
    lastCommit: Date,
    language: String,
    topics: [String]
  },
  // Likes feature - embedded approach for better performance
  likes: {
    count: {
      type: Number,
      default: 0
    },
    // Store user IDs who liked this project
    userIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Optimized indexes - only keep essential ones
projectSchema.index({ userId: 1, createdAt: -1 });
// Index for likes sorting
projectSchema.index({ 'likes.count': -1, createdAt: -1 });

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
 * Update project metadata from GitHub
 * Uses caching to reduce API calls
 */
projectSchema.methods.updateMetadata = async function() {
  try {
    // Extract owner and repo from URL
    const match = this.repositoryUrl.match(/github\.com\/([^\/]+)\/([^\/\s]+)/);
    if (!match) {
      throw new Error('Invalid GitHub repository URL format');
    }

    const [_, owner, repo] = match;
    const cleanRepo = repo.replace(/\.git$/, '').split('#')[0]; // Remove .git and fragments
    
    // Fetch repository data with caching
    const data = await fetchRepositoryWithCache(owner, cleanRepo);
    
    // Update metadata
    this.metadata = {
      stars: data.stargazers_count,
      forks: data.forks_count,
      lastCommit: data.pushed_at,
      language: data.language,
      topics: data.topics || []
    };
    this.lastChecked = new Date();
    
    await this.save();
    return true;
  } catch (error) {
    console.error('Error updating metadata:', error);
    return false;
  }
};

/**
 * Like/unlike methods for the likes feature
 */

/**
 * Add a like to the project
 * @param {ObjectId} userId - The ID of the user liking the project
 * @param {Object} options - Options object
 * @param {Boolean} options.updateUser - Whether to update the User model (default: true)
 * @param {mongoose.ClientSession} options.session - Mongoose session for transactions
 * @returns {Promise<Object>} Result object with success status and likes count
 */
projectSchema.methods.likeProject = async function(userId, options = {}) {
  const { updateUser = true, session = null } = options;
  
  try {
    // Check if user already liked this project
    if (this.likes.userIds.some(id => id.equals(userId))) {
      return { success: false, message: 'User already liked this project', likes: this.likes.count };
    }
    
    // Add user to likes and increment count
    this.likes.userIds.push(userId);
    this.likes.count = this.likes.userIds.length;
    
    // Use session if provided, otherwise regular save
    if (session) {
      await this.save({ session });
    } else {
      await this.save();
    }
    
    // Update the user if requested
    if (updateUser) {
      const User = mongoose.model('User');
      
      // If we have a session, use it for the user update
      if (session) {
        const user = await User.findById(userId).session(session);
        if (user) {
          await user.likeProject(this._id, { updateProject: false, session });
        }
      } else {
        // Without a session, we'll use a separate operation
        const user = await User.findById(userId);
        if (user) {
          await user.likeProject(this._id, { updateProject: false });
        }
      }
    }
    
    return { success: true, likes: this.likes.count };
  } catch (error) {
    console.error('Error liking project:', error);
    throw new Error('Failed to like project');
  }
};

/**
 * Remove a like from the project
 * @param {ObjectId} userId - The ID of the user unliking the project
 * @param {Object} options - Options object
 * @param {Boolean} options.updateUser - Whether to update the User model (default: true)
 * @param {mongoose.ClientSession} options.session - Mongoose session for transactions
 * @returns {Promise<Object>} Result object with success status and likes count
 */
projectSchema.methods.unlikeProject = async function(userId, options = {}) {
  const { updateUser = true, session = null } = options;
  
  try {
    // Check if user liked this project
    if (!this.likes.userIds.some(id => id.equals(userId))) {
      return { success: false, message: 'User has not liked this project', likes: this.likes.count };
    }
    
    // Remove user from likes and update count
    this.likes.userIds = this.likes.userIds.filter(id => !id.equals(userId));
    this.likes.count = this.likes.userIds.length;
    
    // Use session if provided, otherwise regular save
    if (session) {
      await this.save({ session });
    } else {
      await this.save();
    }
    
    // Update the user if requested
    if (updateUser) {
      const User = mongoose.model('User');
      
      // If we have a session, use it for the user update
      if (session) {
        const user = await User.findById(userId).session(session);
        if (user) {
          await user.unlikeProject(this._id, { updateProject: false, session });
        }
      } else {
        // Without a session, we'll use a separate operation
        const user = await User.findById(userId);
        if (user) {
          await user.unlikeProject(this._id, { updateProject: false });
        }
      }
    }
    
    return { success: true, likes: this.likes.count };
  } catch (error) {
    console.error('Error unliking project:', error);
    throw new Error('Failed to unlike project');
  }
};

/**
 * Check if a user has liked this project
 * @param {ObjectId} userId - The ID of the user to check
 * @returns {Boolean} True if the user has liked the project
 */
projectSchema.methods.hasUserLiked = function(userId) {
  return this.likes.userIds.some(id => id.equals(userId));
};

/**
 * Pre-save middleware
 * Validates repository URL before saving using GitHub API
 * If validation fails, the document won't be saved (hard validation)
 */
projectSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('repositoryUrl')) {
    try {
      // Extract owner and repo from URL
      const match = this.repositoryUrl.match(/github\.com\/([^\/]+)\/([^\/\s]+)/);
      if (!match) {
        throw new Error('Invalid GitHub repository URL format');
      }

      const [_, owner, repo] = match;
      const cleanRepo = repo.replace(/\.git$/, '').split('#')[0]; // Remove .git and fragments
      
      try {
        // Fetch repository data with caching
        const data = await fetchRepositoryWithCache(owner, cleanRepo);
        
        // Update metadata
        this.metadata = {
          stars: data.stargazers_count,
          forks: data.forks_count,
          lastCommit: data.pushed_at,
          language: data.language,
          topics: data.topics || []
        };
      } catch (error) {
        // If we can't validate the repository, don't save it
        if (error.status === 404) {
          throw new Error('Repository not found');
        } else if (error.status === 403 && error.response?.headers?.['x-ratelimit-remaining'] === '0') {
          throw new Error('GitHub API rate limit exceeded. Please try again later.');
        } else {
          throw new Error('Failed to validate repository');
        }
      }
    } catch (error) {
      return next(error); // This prevents saving the document
    }
  }
  next();
});

// Static methods
projectSchema.statics = {
  /**
   * Find projects by popularity (most likes)
   * @param {Object} options - Query options
   * @param {Number} options.limit - Maximum number of projects to return
   * @param {Number} options.skip - Number of projects to skip
   * @returns {Promise<Array>} Array of project documents
   */
  findByPopularity: async function(options = {}) {
    const { limit = 10, skip = 0 } = options;
    
    return this.find()
      .sort({ 'likes.count': -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
  },
  
  /**
   * Find projects liked by a specific user
   * @param {ObjectId} userId - User ID
   * @param {Object} options - Query options
   * @param {Number} options.limit - Maximum number of projects to return
   * @param {Number} options.skip - Number of projects to skip
   * @returns {Promise<Array>} Array of project documents
   */
  findProjectsLikedByUser: async function(userId, options = {}) {
    const { limit = 10, skip = 0 } = options;
    
    return this.find({ 
      'likes.userIds': userId
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
  },
  
  /**
   * Perform a like operation with transaction support
   * @param {ObjectId} projectId - Project ID
   * @param {ObjectId} userId - User ID
   * @returns {Promise<Object>} Result object
   */
  likeProjectWithTransaction: async function(projectId, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const project = await this.findById(projectId).session(session);
      if (!project) {
        await session.abortTransaction();
        session.endSession();
        return { success: false, message: 'Project not found' };
      }
      
      const result = await project.likeProject(userId, { session });
      
      await session.commitTransaction();
      session.endSession();
      return result;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error('Transaction failed:', error);
      throw new Error('Failed to like project');
    }
  },
  
  /**
   * Perform an unlike operation with transaction support
   * @param {ObjectId} projectId - Project ID
   * @param {ObjectId} userId - User ID
   * @returns {Promise<Object>} Result object
   */
  unlikeProjectWithTransaction: async function(projectId, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const project = await this.findById(projectId).session(session);
      if (!project) {
        await session.abortTransaction();
        session.endSession();
        return { success: false, message: 'Project not found' };
      }
      
      const result = await project.unlikeProject(userId, { session });
      
      await session.commitTransaction();
      session.endSession();
      return result;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error('Transaction failed:', error);
      throw new Error('Failed to unlike project');
    }
  }
};

// Create model
const Project = mongoose.model('Project', projectSchema);

module.exports = Project; 