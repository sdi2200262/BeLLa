const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authController = require('../controllers/authController');

/**
 * Auth Routes
 */

// GitHub OAuth callback
router.post('/github', authController.githubCallback);

// Logout
router.post('/logout', auth, authController.logout);

// Get current user
router.get('/me', auth, authController.getCurrentUser);

module.exports = router; 