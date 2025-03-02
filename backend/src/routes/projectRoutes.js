const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const projectController = require('../controllers/projectController');

/**
 * Project Routes
 * All routes require authentication
 */

// Get all projects
router.get('/', projectController.getAllProjects);

// Get user's projects
router.get('/user', auth, projectController.getUserProjects);

// Get project data
router.get('/data', projectController.getProjectData);

// Get file tree
router.get('/tree', projectController.getFileTree);

// Get file content
router.get('/content', projectController.getFileContent);

// Add project (auth required)
router.post('/', auth, projectController.addProject);

// Delete project (auth required)
router.delete('/:id', auth, projectController.deleteProject);

module.exports = router; 