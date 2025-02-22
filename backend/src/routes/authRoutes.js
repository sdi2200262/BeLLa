const express = require('express');
const router = express.Router();
const { githubAuth } = require('../controllers/authController');

// Handle the GitHub OAuth callback
router.post('/github', githubAuth);

module.exports = router; 