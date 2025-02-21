const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

// Get all projects
router.get('/', projectController.getAllProjects);

// Get repository data from GitHub
router.get('/repo', projectController.getProjectData);

// Add a new project
router.post('/', projectController.addProject);

// Delete a project
router.delete('/:id', projectController.deleteProject);

module.exports = router; 