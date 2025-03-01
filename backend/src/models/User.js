const mongoose = require('mongoose');

/**
 * User Schema
 * Optimized for GitHub OAuth authentication with minimal resource usage
 */
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
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
    }
  },
  githubId: {
    type: String,
    sparse: true,
    unique: true,
    index: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  // Track liked projects for quick access
  likedProjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }]
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    transform: (doc, ret) => {
      delete ret.__v;
      return ret;
    }
  }
});

/**
 * Define only essential indexes for optimal performance
 */
const INDEXES = [
  { key: { username: 1 }, options: { unique: true } },
  { key: { email: 1 }, options: { unique: true } },
  { key: { githubId: 1 }, options: { unique: true, sparse: true } },
  // Index for faster lookup of liked projects
  { key: { likedProjects: 1 }, options: {} }
];

// Instance methods
userSchema.methods = {
  // Update last login with minimal fields
  updateLastLogin: async function() {
    this.lastLogin = new Date();
    await this.save();
  },

  /**
   * Like a project - coordinated with Project model
   * @param {ObjectId} projectId - The ID of the project to like
   * @param {Object} options - Options object
   * @param {Boolean} options.updateProject - Whether to update the Project model (default: true)
   * @param {mongoose.ClientSession} options.session - Mongoose session for transactions
   * @returns {Promise<Object>} Result object
   */
  likeProject: async function(projectId, options = {}) {
    const { updateProject = true, session = null } = options;
    
    try {
      // Check if already liked
      if (this.likedProjects.some(id => id.equals(projectId))) {
        return { success: false, message: 'Project already liked' };
      }
      
      // Add to liked projects
      this.likedProjects.push(projectId);
      
      // Use session if provided, otherwise regular save
      if (session) {
        await this.save({ session });
      } else {
        await this.save();
      }
      
      // Update the project if requested
      if (updateProject) {
        const Project = mongoose.model('Project');
        
        // If we have a session, use it for the project update
        if (session) {
          const project = await Project.findById(projectId).session(session);
          if (project) {
            await project.likeProject(this._id, { updateUser: false, session });
          }
        } else {
          // Without a session, we'll use a separate operation
          const project = await Project.findById(projectId);
          if (project) {
            await project.likeProject(this._id, { updateUser: false });
          }
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to like project:', error);
      throw new Error('Failed to like project');
    }
  },

  /**
   * Unlike a project - coordinated with Project model
   * @param {ObjectId} projectId - The ID of the project to unlike
   * @param {Object} options - Options object
   * @param {Boolean} options.updateProject - Whether to update the Project model (default: true)
   * @param {mongoose.ClientSession} options.session - Mongoose session for transactions
   * @returns {Promise<Object>} Result object
   */
  unlikeProject: async function(projectId, options = {}) {
    const { updateProject = true, session = null } = options;
    
    try {
      // Check if liked
      if (!this.likedProjects.some(id => id.equals(projectId))) {
        return { success: false, message: 'Project not liked' };
      }
      
      // Remove from liked projects
      this.likedProjects = this.likedProjects.filter(id => !id.equals(projectId));
      
      // Use session if provided, otherwise regular save
      if (session) {
        await this.save({ session });
      } else {
        await this.save();
      }
      
      // Update the project if requested
      if (updateProject) {
        const Project = mongoose.model('Project');
        
        // If we have a session, use it for the project update
        if (session) {
          const project = await Project.findById(projectId).session(session);
          if (project) {
            await project.unlikeProject(this._id, { updateUser: false, session });
          }
        } else {
          // Without a session, we'll use a separate operation
          const project = await Project.findById(projectId);
          if (project) {
            await project.unlikeProject(this._id, { updateUser: false });
          }
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to unlike project:', error);
      throw new Error('Failed to unlike project');
    }
  },

  /**
   * Check if user has liked a project
   * @param {ObjectId} projectId - The ID of the project to check
   * @returns {Boolean} True if the user has liked the project
   */
  hasLiked: function(projectId) {
    return this.likedProjects.some(id => id.equals(projectId));
  }
};

// Static methods
userSchema.statics = {
  /**
   * Find user by ID
   * @param {ObjectId} id - User ID
   * @returns {Promise<Object>} User document
   */
  findUserById: async function(id) {
    return this.findById(id)
      .lean()
      .exec();
  },

  /**
   * Find by GitHub ID with null handling
   * @param {String} githubId - GitHub ID
   * @returns {Promise<Object>} User document
   */
  findByGithubId: async function(githubId) {
    if (!githubId) return null;
    
    return this.findOne({ githubId })
      .lean()
      .exec();
  },
  
  /**
   * Find users who liked a project
   * @param {ObjectId} projectId - Project ID
   * @param {Object} options - Query options
   * @param {Number} options.limit - Maximum number of users to return
   * @param {Number} options.skip - Number of users to skip
   * @returns {Promise<Array>} Array of user documents
   */
  findUsersByLikedProject: async function(projectId, options = {}) {
    const { limit = 10, skip = 0 } = options;
    
    return this.find({ likedProjects: projectId })
      .select('username email')
      .sort({ username: 1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
  },
  
  /**
   * Count users who liked a project
   * @param {ObjectId} projectId - Project ID
   * @returns {Promise<Number>} Count of users
   */
  countUsersByLikedProject: async function(projectId) {
    return this.countDocuments({ likedProjects: projectId });
  },
  
  /**
   * Perform a like operation with transaction support
   * @param {ObjectId} userId - User ID
   * @param {ObjectId} projectId - Project ID
   * @returns {Promise<Object>} Result object
   */
  likeProjectWithTransaction: async function(userId, projectId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const user = await this.findById(userId).session(session);
      if (!user) {
        await session.abortTransaction();
        session.endSession();
        return { success: false, message: 'User not found' };
      }
      
      const result = await user.likeProject(projectId, { session });
      
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
   * @param {ObjectId} userId - User ID
   * @param {ObjectId} projectId - Project ID
   * @returns {Promise<Object>} Result object
   */
  unlikeProjectWithTransaction: async function(userId, projectId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const user = await this.findById(userId).session(session);
      if (!user) {
        await session.abortTransaction();
        session.endSession();
        return { success: false, message: 'User not found' };
      }
      
      const result = await user.unlikeProject(projectId, { session });
      
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
const User = mongoose.model('User', userSchema);

/**
 * Create indexes without dropping existing ones
 * This is safer for production environments
 */
const createIndexes = async () => {
  try {
    // Get existing indexes
    const existingIndexes = await User.collection.indexes();
    const existingIndexNames = existingIndexes.map(index => index.name);
    
    // Create indexes that don't exist yet
    const indexPromises = INDEXES.map(({ key, options }) => {
      const indexName = Object.entries(key)
        .map(([field, direction]) => `${field}_${direction}`)
        .join('_');
        
      if (!existingIndexNames.includes(indexName)) {
        return User.collection.createIndex(key, options);
      }
      return Promise.resolve();
    });
    
    await Promise.all(indexPromises);
    console.log('User indexes verified successfully');
  } catch (error) {
    console.error('Error managing user indexes:', error);
  }
};

// Initialize indexes
createIndexes();

module.exports = User; 