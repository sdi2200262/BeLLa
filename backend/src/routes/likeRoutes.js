const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const likeController = require('../controllers/likeController');
const { validateParams, validateBody, schemas } = require('../middleware/validator');
const { burstLimiter } = require('../middleware/rateLimiter');

/**
 * Like Routes
 * All routes require authentication
 */

// Get like counts for multiple projects - moved up to ensure this route is matched first
router.post(
  '/counts',
  authenticate,
  validateBody(schemas.like.counts),
  likeController.getLikeCounts
);

// Toggle like status for a project
router.post(
  '/:projectId',
  authenticate,
  burstLimiter,
  validateParams(schemas.like.params),
  likeController.toggleLike
);

// Get like status for a project
router.get(
  '/:projectId',
  authenticate,
  validateParams(schemas.like.params),
  likeController.getLikeStatus
);

/**
 * @route GET /api/likes/user/liked
 * @desc Get all projects liked by the current user
 * @access Private
 */
router.get('/user/liked',
  authenticate,
  likeController.getUserLikedProjects
);

module.exports = router; 