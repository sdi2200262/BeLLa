const Like = require('../models/Like');
const Project = require('../models/Project');
const cacheService = require('../services/cacheService');
const logger = require('../services/logService');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { CACHE_CONFIG } = require('../config/config');
const NodeCache = require('node-cache');

// Cache for storing like counts with a TTL of 5 minutes
const likeCountCache = new NodeCache({ stdTTL: 300 });

/**
 * Like Controller
 * Handles project like operations with caching
 */
const likeController = {
  /**
   * Toggle like status for a project
   */
  toggleLike: asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const userId = req.user.id;

    // Validate project exists
    const project = await Project.findById(projectId);
    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    // Toggle like status
    const result = await Like.toggleLike(userId, projectId);
    
    // Get updated count
    const likeCount = await Like.getCount(projectId);
    
    // Clear specific caches related to this project and user
    const projectCacheKey = `user-projects:${userId}`;
    const likeCacheKey = `likes:user:${userId}:project:${projectId}`;
    const countCacheKey = `likes:count:${projectId}`;
    
    // Clear only the specific cache keys
    if (cacheService.has('projects', projectCacheKey)) {
      cacheService.del('projects', projectCacheKey);
    }
    
    if (cacheService.has('projects', likeCacheKey)) {
      cacheService.del('projects', likeCacheKey);
    }
    
    if (cacheService.has('projects', countCacheKey)) {
      cacheService.del('projects', countCacheKey);
    }
    
    res.json({
      liked: result.liked,
      likeCount
    });
  }),

  /**
   * Get like status and count for a project
   */
  getLikeStatus: asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const userId = req.user.id;
    
    // Check cache first
    const cacheKey = `likes:user:${userId}:project:${projectId}`;
    const cached = cacheService.get('projects', cacheKey);
    
    if (cached) {
      return res.json({
        ...cached,
        cached: true
      });
    }
    
    // Validate project exists
    const project = await Project.findById(projectId);
    if (!project) {
      throw ApiError.notFound('Project not found');
    }
    
    // Get like status and count
    const [liked, likeCount] = await Promise.all([
      Like.hasLiked(userId, projectId),
      Like.getCount(projectId)
    ]);
    
    const result = { liked, likeCount };
    
    // Cache the result
    cacheService.set('projects', cacheKey, result, CACHE_CONFIG.PROJECTS.TTL);
    
    res.json({
      ...result,
      cached: false
    });
  }),

  /**
   * Get like counts for multiple projects
   */
  getLikeCounts: asyncHandler(async (req, res) => {
    try {
      // Add debugging to see what's in the request body
      console.log('getLikeCounts received request body:', req.body);
      console.log('Content-Type:', req.get('Content-Type'));
      
      const { projectIds } = req.body;
      
      if (!projectIds || !Array.isArray(projectIds)) {
        console.log('projectIds validation failed:', { projectIds, type: typeof projectIds, isArray: Array.isArray(projectIds) });
        return res.json({
          counts: {},
          cached: false,
          message: 'No valid project IDs provided'
        });
      }
      
      // Filter out invalid IDs
      const validIds = projectIds.filter(id => 
        typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)
      );
      
      // Add debug for what IDs we found valid
      console.log(`Found ${validIds.length} valid IDs out of ${projectIds.length}`);
      
      if (validIds.length === 0) {
        return res.json({
          counts: {},
          cached: false,
          message: 'No valid project IDs found'
        });
      }
      
      // Log if we filtered out any IDs
      if (validIds.length < projectIds.length) {
        logger.warn(`Filtered out ${projectIds.length - validIds.length} invalid project IDs`);
      }
      
      // Limit number of projects to avoid excessive processing
      const limitedIds = validIds.slice(0, 50);
      
      // Generate cache key based on sorted project IDs for consistency
      const cacheKey = `likes:counts:${limitedIds.sort().join(',')}`;
      const cached = cacheService.get('projects', cacheKey);
      
      if (cached) {
        return res.json({
          counts: cached,
          cached: true
        });
      }
      
      // Get counts for all projects
      const counts = await Like.getCounts(limitedIds);
      
      // Cache the result
      cacheService.set('projects', cacheKey, counts, CACHE_CONFIG.PROJECTS.TTL);
      
      res.json({
        counts,
        cached: false
      });
    } catch (error) {
      logger.error('Error in getLikeCounts:', error);
      res.status(500).json({
        counts: {},
        cached: false,
        message: 'Error retrieving like counts'
      });
    }
  }),

  /**
   * Get all projects liked by the current user
   */
  getUserLikedProjects: asyncHandler(async (req, res) => {
    try {
      const userId = req.user.id;

      // Find all likes by the user
      const userLikes = await Like.find({ userId });
      
      if (!userLikes.length) {
        return res.status(200).json({ 
          success: true, 
          projects: []
        });
      }

      // Extract project IDs from likes
      const projectIds = userLikes.map(like => like.projectId.toString());
      
      // Fetch the actual projects
      const likedProjects = await Project.find({ _id: { $in: projectIds } });
      
      // Get like counts for these projects using the improved getCounts method
      const likeCountMap = await Like.getCounts(projectIds);
      
      // Add like count and liked status to each project
      const projectsWithLikes = likedProjects.map(project => {
        const projectObj = project.toObject();
        const projectId = project._id.toString();
        projectObj.likeCount = likeCountMap[projectId] || 0;
        projectObj.liked = true; // Since these are all liked by the user
        return projectObj;
      });

      return res.status(200).json({ 
        success: true, 
        projects: projectsWithLikes
      });
    } catch (error) {
      logger.error('Error in getUserLikedProjects:', error);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving liked projects',
        error: error.message
      });
    }
  })
};

module.exports = likeController; 