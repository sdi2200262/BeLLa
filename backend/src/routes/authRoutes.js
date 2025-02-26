const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const authController = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');
const { validateBody, schemas } = require('../middleware/validator');

/**
 * Auth Routes
 */

// GitHub OAuth callback - rate limited and validated
router.post('/github', authLimiter, validateBody(schemas.auth.github), authController.githubCallback);

// Logout - requires authentication
router.post('/logout', authenticate, authController.logout);

// Get current user - requires authentication
router.get('/me', authenticate, authController.getCurrentUser);

module.exports = router; 