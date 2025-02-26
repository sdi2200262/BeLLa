const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const projectController = require('../controllers/projectController');
const { authLimiter } = require('../middleware/rateLimiter');
const { validateBody, validateQuery, schemas } = require('../middleware/validator');

/**
 * Project Routes
 */

// Public routes
router.get('/', validateQuery(schemas.project.query), projectController.getAllProjects);
router.get('/data', validateQuery(schemas.project.query), projectController.getProjectData);
router.get('/tree', validateQuery(schemas.project.query), projectController.getFileTree);

// Protected routes
router.get('/user', authenticate, validateQuery(schemas.project.query), projectController.getUserProjects);
router.post('/', authenticate, authLimiter, validateBody(schemas.project.create), projectController.addProject);
router.delete('/:id', authenticate, projectController.deleteProject);

module.exports = router; 