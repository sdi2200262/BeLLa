const express = require('express');
const router = express.Router();
const githubController = require('../controllers/githubController');

// Route to fetch public repositories for a given GitHub username
router.get('/user/:username/repos', githubController.getUserRepos);
router.get('/repos/:username/:repo/contents', githubController.getRepoContents);
router.get('/file-content', githubController.getFileContent);

module.exports = router; 