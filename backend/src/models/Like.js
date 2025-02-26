const mongoose = require('mongoose');
const logger = require('../services/logService');

/**
 * Like Schema
 * Represents a user liking a project
 * Optimized for minimal storage and query performance
 */
const likeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  }
}, {
  timestamps: true,
  // Use compound index for uniqueness and efficient queries
  // This ensures a user can only like a project once
  indexes: [
    { fields: { userId: 1, projectId: 1 }, unique: true }
  ]
});

// Compound index for the most common query pattern
likeSchema.index({ projectId: 1, userId: 1 }, { unique: true });

// Static methods for efficient operations
likeSchema.statics = {
  /**
   * Toggle like status for a project
   * @param {string} userId - User ID
   * @param {string} projectId - Project ID
   * @returns {Object} Result with liked status and count
   */
  async toggleLike(userId, projectId) {
    try {
      // Check if like exists
      const existingLike = await this.findOne({ userId, projectId }).lean();
      
      if (existingLike) {
        // Unlike - remove the like
        await this.deleteOne({ userId, projectId });
        return { liked: false };
      } else {
        // Like - create new like
        try {
          await this.create({ userId, projectId });
          return { liked: true };
        } catch (error) {
          // Handle duplicate key error (race condition where like was created between check and create)
          if (error.code === 11000) {
            logger.warn('Duplicate like detected (race condition)', { userId, projectId });
            return { liked: true };
          }
          throw error;
        }
      }
    } catch (error) {
      logger.error('Error toggling like:', error);
      throw error;
    }
  },

  /**
   * Check if user has liked a project
   * @param {string} userId - User ID
   * @param {string} projectId - Project ID
   * @returns {boolean} True if liked
   */
  async hasLiked(userId, projectId) {
    return !!(await this.findOne({ userId, projectId }).lean());
  },

  /**
   * Get like count for a project
   * @param {string} projectId - Project ID
   * @returns {number} Like count
   */
  async getCount(projectId) {
    return this.countDocuments({ projectId });
  },

  /**
   * Get like counts for multiple projects
   * @param {Array} projectIds - Array of project IDs
   * @returns {Object} Map of project IDs to like counts
   */
  async getCounts(projectIds) {
    try {
      // Convert string IDs to ObjectIds, skipping any that are invalid
      const validObjectIds = [];
      const validStringIds = [];
      
      for (const id of projectIds) {
        try {
          if (typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)) {
            validObjectIds.push(new mongoose.Types.ObjectId(id));
            validStringIds.push(id);
          }
        } catch (err) {
          logger.warn(`Skipping invalid project ID in getCounts: ${id}`);
        }
      }
      
      if (validObjectIds.length === 0) {
        return {}; // Return empty object if no valid IDs
      }
      
      const counts = await this.aggregate([
        { $match: { projectId: { $in: validObjectIds } } },
        { $group: { _id: '$projectId', count: { $sum: 1 } } }
      ]);
      
      // Convert to map for easy lookup
      const countMap = {};
      counts.forEach(item => {
        countMap[item._id.toString()] = item.count;
      });
      
      // Ensure all valid projects have a count (even if 0)
      validStringIds.forEach(id => {
        if (!countMap[id]) countMap[id] = 0;
      });
      
      return countMap;
    } catch (error) {
      logger.error('Error in getCounts:', error);
      return {}; // Return empty object on error
    }
  }
};

// Create model
const Like = mongoose.model('Like', likeSchema);

// Create indexes with error handling
const createIndexes = async () => {
  try {
    await Like.collection.createIndex(
      { userId: 1, projectId: 1 },
      { unique: true }
    );
    logger.info('Like indexes created successfully');
  } catch (error) {
    logger.error('Error creating like indexes:', error);
  }
};

// Initialize indexes
createIndexes();

module.exports = Like; 