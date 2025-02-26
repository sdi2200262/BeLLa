const express = require('express');
const router = express.Router();
const contributorsController = require('../controllers/contributorsController');
const { standardLimiter } = require('../middleware/rateLimiter');

/**
 * Contributors Routes
 */
router.get('/', standardLimiter, contributorsController.getContributors);

module.exports = router; 