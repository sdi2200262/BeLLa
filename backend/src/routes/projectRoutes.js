const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const projectController = require('../controllers/projectController');
const { rateLimiter } = require('../middleware/rateLimiter');

/**
 * Project Routes
 * Optimized for Render free tier
 */

// Get all projects (with rate limiting)
router.get('/', rateLimiter('standard'), projectController.getAllProjects);

// Get user's projects
router.get('/user', auth, projectController.getUserProjects);

// Get project data (with rate limiting)
router.get('/data', rateLimiter('github'), projectController.getProjectData);

// Get file tree (with rate limiting)
router.get('/tree', rateLimiter('github'), projectController.getFileTree);

// Add project (auth required)
router.post('/', auth, projectController.addProject);

// Delete project (auth required) - changed from "Archive project"
router.delete('/:id', auth, projectController.deleteProject);

// Like/unlike project (auth required)
router.post('/:id/like', auth, projectController.toggleLike);

module.exports = router; 