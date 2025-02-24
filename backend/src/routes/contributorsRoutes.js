const express = require('express');
const router = express.Router();
const contributorsController = require('../controllers/contributorsController');

/**
 * Contributors Routes
 */
router.get('/', contributorsController.getContributors);

module.exports = router; 