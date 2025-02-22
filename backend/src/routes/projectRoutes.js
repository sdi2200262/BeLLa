const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { githubApiLimiter, cacheMiddleware } = require('../middleware/rateLimiter');

// Get all projects (cache for 1 minute)
router.get('/', cacheMiddleware(60), projectController.getAllProjects);

// Get repository data from GitHub (with rate limiting and 5-minute cache)
router.get('/repo', githubApiLimiter, cacheMiddleware(300), projectController.getProjectData);

// Get repository file tree (with rate limiting and 5-minute cache)
router.get('/files', githubApiLimiter, cacheMiddleware(300), projectController.getFileTree);

// Get file content (with rate limiting and 5-minute cache)
router.get('/content', githubApiLimiter, cacheMiddleware(300), projectController.getFileContent);

// Add a new project (with rate limiting)
router.post('/', githubApiLimiter, projectController.addProject);

// Delete a project
router.delete('/:id', projectController.deleteProject);

module.exports = router; 