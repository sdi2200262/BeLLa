const express = require('express');
const router = express.Router();
const contributorsController = require('../controllers/contributorsController');
const { rateLimiter } = require('../middleware/rateLimiter');

/**
 * Contributors Routes
 * Optimized for Render free tier
 */

// Get all contributors (with rate limiting)
router.get('/', rateLimiter('github'), contributorsController.getContributors);

module.exports = router; 