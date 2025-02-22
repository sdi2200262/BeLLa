const Project = require('../models/Project');
const githubService = require('../services/githubService');
const { clearCache } = require('../middleware/rateLimiter');

exports.getAllProjects = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const search = req.query.search || '';
    
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;
    
    // Build query
    let query = {};
    if (search) {
      query.repositoryUrl = { $regex: search, $options: 'i' };
    }
    
    // Get total count for pagination
    const totalProjects = await Project.countDocuments(query);
    const totalPages = Math.ceil(totalProjects / limit);
    
    // Get paginated projects
    const projects = await Project.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    res.json({
      projects,
      totalPages,
      currentPage: page,
      totalProjects
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

exports.getProjectData = async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: 'Repository URL is required' });
    }

    const data = await githubService.getRepositoryData(url);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addProject = async (req, res) => {
  try {
    const { repositoryUrl, uploadedBy } = req.body;
    
    if (!repositoryUrl || !uploadedBy) {
      return res.status(400).json({ error: 'Repository URL and uploader information are required' });
    }

    // Check if project already exists
    const existingProject = await Project.findOne({ repositoryUrl });
    if (existingProject) {
      return res.status(409).json({ error: 'This repository has already been added' });
    }

    // Validate the URL by attempting to fetch repository data
    await githubService.getRepositoryData(repositoryUrl);

    const project = new Project({
      repositoryUrl,
      uploadedBy
    });

    await project.save();
    
    // Clear the projects cache
    clearCache('/api/projects');
    
    res.status(201).json(project);
  } catch (error) {
    // Handle MongoDB duplicate key error specifically
    if (error.code === 11000) {
      return res.status(409).json({ error: 'This repository has already been added' });
    }
    
    res.status(500).json({ error: error.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findByIdAndDelete(id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Clear the projects cache
    clearCache('/api/projects');
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
};

exports.getFileTree = async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: 'Repository URL is required' });
    }

    const fileTree = await githubService.getFileTree(url);
    res.json(fileTree);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getFileContent = async (req, res) => {
  try {
    const { url, path } = req.query;
    if (!url || !path) {
      return res.status(400).json({ error: 'Repository URL and file path are required' });
    }

    const content = await githubService.getFileContent(url, path);
    res.json(content);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 