const Project = require('../models/Project');
const githubService = require('../services/githubService');

exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
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
    const { repositoryUrl, uploadedBy, isBellaProject } = req.body;
    
    if (!repositoryUrl || !uploadedBy) {
      return res.status(400).json({ error: 'Repository URL and uploader information are required' });
    }

    // Validate the URL by attempting to fetch repository data
    await githubService.getRepositoryData(repositoryUrl);

    const project = new Project({
      repositoryUrl,
      uploadedBy,
      isBellaProject: Boolean(isBellaProject)
    });

    await project.save();
    res.status(201).json(project);
  } catch (error) {
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
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
}; 