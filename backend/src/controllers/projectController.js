const Project = require('../models/Project');
const githubService = require('../services/githubService');
const cacheService = require('../services/cacheService');
const logger = require('../services/logService');
const { Octokit } = require('octokit');
const { PROJECT_LIMITS, CACHE_CONFIG, AUTH_CONFIG } = require('../config/config');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const Like = require('../models/Like');

/**
 * Project Controller
 * Optimized for free tier with caching and resource limits
 */
const projectController = {
  // Get all projects with caching and size limits
  getAllProjects: asyncHandler(async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const search = (req.query.search || '').slice(0, PROJECT_LIMITS.MAX_SEARCH_LENGTH);
      
      const cacheKey = `projects:${page}:${search}`;
      const cached = cacheService.get('projects', cacheKey);
      if (cached) {
        return res.json({
          ...cached,
          cached: true,
          cacheExpiry: cacheService.getTtl('projects', cacheKey)
        });
      }

      // Include both active and error status projects
      const query = {};
      if (search) {
        query.repositoryUrl = { $regex: search, $options: 'i' };
      }

      const [totalProjects, projects] = await Promise.all([
        Project.countDocuments(query),
        Project.find(query)
          .select('repositoryUrl uploadedBy metadata.language metadata.stars createdAt status')
          .lean()
          .sort({ createdAt: -1 })
          .skip((page - 1) * PROJECT_LIMITS.PAGE_SIZE)
          .limit(PROJECT_LIMITS.PAGE_SIZE)
      ]);

      // Get like counts for all projects
      const projectIds = projects.map(p => p._id.toString());
      const likeCounts = await Like.getCounts(projectIds);
      
      // Add like counts to projects
      const projectsWithLikes = projects.map(project => ({
        ...project,
        likeCount: likeCounts[project._id.toString()] || 0
      }));

      const response = {
        projects: projectsWithLikes,
        pagination: {
          total: totalProjects,
          pages: Math.ceil(totalProjects / PROJECT_LIMITS.PAGE_SIZE),
          current: page,
          hasMore: page * PROJECT_LIMITS.PAGE_SIZE < totalProjects
        },
        limits: {
          projectsPerUser: PROJECT_LIMITS.PROJECTS_PER_USER,
          cacheTime: CACHE_CONFIG.PROJECTS.TTL
        }
      };

      // Check response size before caching
      const responseSize = Buffer.byteLength(JSON.stringify(response));
      if (responseSize <= CACHE_CONFIG.PROJECTS.MAX_SIZE) {
        cacheService.set('projects', cacheKey, response);
      }

      res.json({
        ...response,
        cached: false
      });
    } catch (error) {
      logger.error('Error in getAllProjects:', error);
      res.status(500).json({
        message: 'Error retrieving projects',
        error: error.message
      });
    }
  }),

  // Get user's projects
  getUserProjects: asyncHandler(async (req, res) => {
    try {
      const userId = req.user.id;
      const cacheKey = `user-projects:${userId}`;
      
      // Check cache
      const cached = cacheService.get('projects', cacheKey);
      if (cached) {
        return res.json({
          ...cached,
          cached: true,
          cacheExpiry: cacheService.getTtl('projects', cacheKey)
        });
      }

      // Get user's active projects
      const projects = await Project.find({ 
        userId
      })
      .select('repositoryUrl uploadedBy status createdAt')
      .sort({ createdAt: -1 })
      .lean();

      // Get project limits
      const limits = await Project.checkUserLimit(userId);

      // Get like counts and user's like status for all projects
      const projectIds = projects.map(p => p._id.toString());
      
      // Only proceed with valid project IDs
      const validProjectIds = projectIds.filter(id => 
        typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)
      );
      
      const [likeCounts, userLikes] = await Promise.all([
        Like.getCounts(validProjectIds),
        Promise.all(validProjectIds.map(projectId => Like.hasLiked(userId, projectId)))
      ]);
      
      // Add like counts and user's like status to projects
      const projectsWithLikes = projects.map(project => {
        const projectId = project._id.toString();
        const validId = /^[0-9a-fA-F]{24}$/.test(projectId);
        const index = validId ? validProjectIds.indexOf(projectId) : -1;
        
        return {
          ...project,
          likeCount: (validId && likeCounts[projectId]) || 0,
          liked: (validId && index !== -1 && userLikes[index]) || false
        };
      });

      const response = {
        projects: projectsWithLikes,
        limits
      };

      // Cache the response
      const responseSize = Buffer.byteLength(JSON.stringify(response));
      if (responseSize <= CACHE_CONFIG.PROJECTS.MAX_SIZE) {
        cacheService.set('projects', cacheKey, response);
      }

      res.json({
        ...response,
        cached: false
      });
    } catch (error) {
      logger.error('Error in getUserProjects:', error);
      res.status(500).json({
        message: 'Error retrieving user projects',
        error: error.message
      });
    }
  }),

  // Get project data with caching
  getProjectData: asyncHandler(async (req, res) => {
    const { url } = req.query;
    if (!url) {
      throw ApiError.badRequest('Repository URL is required');
    }

    // Extract owner and repo from URL
    const match = url.match(/github\.com\/([^\/]+)\/([^\/\s]+)/);
    if (!match) {
      throw ApiError.badRequest('Invalid GitHub repository URL');
    }

    const [_, owner, repo] = match;
    const cacheKey = `repo-data:${owner}/${repo}`;

    // Check cache first
    const cachedData = cacheService.get('projectData', cacheKey);
    if (cachedData) {
      return res.json({
        cached: true,
        cacheExpiry: cachedData.expiry,
        data: cachedData.data
      });
    }

    // Fetch repository data from GitHub
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
      request: {
        timeout: AUTH_CONFIG.GITHUB.API_TIMEOUT
      }
    });

    // Fetch basic repo data
    const repoResponse = await octokit.request('GET /repos/{owner}/{repo}', {
      owner,
      repo,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    // Fetch languages
    const languagesResponse = await octokit.request('GET /repos/{owner}/{repo}/languages', {
      owner,
      repo,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    // Fetch commit count using pagination
    const commitsResponse = await octokit.request('GET /repos/{owner}/{repo}/commits', {
      owner,
      repo,
      per_page: 1,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    // Get total commit count from Link header
    let commitCount = 0;
    const linkHeader = commitsResponse.headers.link;
    if (linkHeader) {
      const matches = linkHeader.match(/page=(\d+)>; rel="last"/);
      if (matches) {
        commitCount = parseInt(matches[1], 10);
      }
    }

    const data = {
      ...repoResponse.data,
      languages: languagesResponse.data,
      commit_count: commitCount,
      forks_count: repoResponse.data.forks_count || 0
    };

    // Cache the result
    cacheService.set('projectData', cacheKey, {
      data,
      expiry: Date.now() + CACHE_CONFIG.PROJECT_DATA.TTL * 1000
    });

    res.json({
      cached: false,
      data
    });
  }),

  // Add project with resource limits
  addProject: asyncHandler(async (req, res) => {
    const { repositoryUrl } = req.body;
    if (!repositoryUrl) {
      throw ApiError.badRequest('Repository URL required');
    }

    // Check user's project limit
    const limits = await Project.checkUserLimit(req.user.id);
    if (limits.exceeded) {
      throw ApiError.forbidden(
        'Project limit reached',
        `Free tier allows ${PROJECT_LIMITS.PROJECTS_PER_USER} active projects per user. Please archive old projects first.`
      );
    }

    // Check for duplicate
    const existing = await Project.findOne({
      repositoryUrl: { $regex: new RegExp('^' + repositoryUrl + '$', 'i') }
    });

    if (existing) {
      throw ApiError.badRequest('Project already exists', 'This repository has already been added');
    }

    // Parse repository URL to get owner and repo name
    try {
      const { owner } = githubService.parseRepoUrl(repositoryUrl);
      
      // Verify repository ownership by checking if the GitHub username matches
      // the authenticated user's username
      if (owner.toLowerCase() !== req.user.username.toLowerCase()) {
        throw ApiError.forbidden(
          'Repository ownership verification failed',
          'You can only add repositories that you own'
        );
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.badRequest('Invalid repository URL', error.message);
    }

    // Create project
    const project = await Project.create({
      repositoryUrl,
      userId: req.user.id,
      uploadedBy: req.user.username
    });

    // Clear relevant caches
    cacheService.flush('projects');

    res.status(201).json({
      project: {
        id: project._id,
        repositoryUrl: project.repositoryUrl,
        uploadedBy: project.uploadedBy
      },
      limits: {
        projectsPerUser: PROJECT_LIMITS.PROJECTS_PER_USER,
        remaining: limits.remaining - 1
      }
    });
  }),

  // Delete project (hard delete)
  deleteProject: asyncHandler(async (req, res) => {
    // Find the project first to ensure it exists and belongs to the user
    const project = await Project.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    });

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    // Delete the project completely
    await Project.deleteOne({ _id: project._id });
    
    // Delete all likes associated with this project
    await Like.deleteMany({ projectId: project._id });
    
    logger.info(`Deleted project ${project._id} and its associated likes`);

    // Clear relevant caches
    cacheService.flush('projects');
    cacheService.del('projectData', `data:${project.repositoryUrl}`);
    
    // Clear any like-related caches for this project
    cacheService.flush('projects'); // Simplest approach is to flush all project caches

    res.json({
      message: 'Project deleted successfully'
    });
  }),

  // Get file tree with depth and size limits
  getFileTree: asyncHandler(async (req, res) => {
    const { url } = req.query;
    if (!url) {
      throw ApiError.badRequest('Repository URL required');
    }

    const tree = await githubService.getFileTree(url);
    const limitedTree = limitTreeDepth(tree, PROJECT_LIMITS.MAX_TREE_DEPTH, PROJECT_LIMITS.MAX_FILES);

    res.json({
      tree: limitedTree,
      limits: {
        maxDepth: PROJECT_LIMITS.MAX_TREE_DEPTH,
        maxFiles: PROJECT_LIMITS.MAX_FILES
      }
    });
  })
};

/**
 * Helper to limit tree depth and size
 */
function limitTreeDepth(tree, maxDepth, maxFiles, currentDepth = 0, fileCount = { count: 0 }) {
  if (!tree || currentDepth >= maxDepth || fileCount.count >= maxFiles) {
    return null;
  }

  if (tree.children) {
    tree.children = tree.children
      .filter(child => fileCount.count < maxFiles)
      .map(child => {
        fileCount.count++;
        return child.type === 'tree'
          ? limitTreeDepth(child, maxDepth, maxFiles, currentDepth + 1, fileCount)
          : child;
      })
      .filter(Boolean);
  }

  return tree;
}

module.exports = projectController;