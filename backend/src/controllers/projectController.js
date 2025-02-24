const Project = require('../models/Project');
const githubService = require('../services/githubService');
const NodeCache = require('node-cache');
const { Octokit } = require('octokit');

/**
 * Cache Configuration
 */
const CACHE_CONFIG = {
  PROJECTS: {
    TTL: 300,          // 5 minutes for project lists
    MAX_KEYS: 100,     // Limit total cached pages
    MAX_SIZE: 100000   // 100KB per cached page
  },
  PROJECT_DATA: {
    TTL: 1800,         // 30 minutes for project data
    MAX_KEYS: 200,     // Limit cached project details
    MAX_SIZE: 250000   // 250KB per project data
  }
};

/**
 * Resource Limits
 */
const LIMITS = {
  PROJECTS_PER_USER: 5,    // Max active projects per user
  PAGE_SIZE: 9,           // Projects per page
  MAX_SEARCH_LENGTH: 50,  // Max search query length
  MAX_TREE_DEPTH: 5,      // Max file tree depth
  MAX_FILES: 500,        // Max files in response
  CACHE_CLEANUP_INTERVAL: 600000 // Clean cache every 10 minutes
};

// Initialize caches with size limits
const projectCache = new NodeCache({
  stdTTL: CACHE_CONFIG.PROJECTS.TTL,
  maxKeys: CACHE_CONFIG.PROJECTS.MAX_KEYS,
  checkperiod: 60,
  useClones: false
});

const projectDataCache = new NodeCache({
  stdTTL: CACHE_CONFIG.PROJECT_DATA.TTL,
  maxKeys: CACHE_CONFIG.PROJECT_DATA.MAX_KEYS,
  checkperiod: 120,
  useClones: false
});

// Periodic cache size check and cleanup
setInterval(() => {
  [
    { cache: projectCache, config: CACHE_CONFIG.PROJECTS },
    { cache: projectDataCache, config: CACHE_CONFIG.PROJECT_DATA }
  ].forEach(({ cache, config }) => {
    const keys = cache.keys();
    keys.forEach(key => {
      const value = cache.get(key);
      const size = Buffer.byteLength(JSON.stringify(value));
      if (size > config.MAX_SIZE) {
        console.warn(`Removing oversized cache entry: ${key} (${size} bytes)`);
        cache.del(key);
      }
    });
  });
}, LIMITS.CACHE_CLEANUP_INTERVAL);

/**
 * Project Controller
 * Optimized for free tier with caching and resource limits
 */
const projectController = {
  // Get all projects with caching and size limits
  async getAllProjects(req, res) {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const search = (req.query.search || '').slice(0, LIMITS.MAX_SEARCH_LENGTH);
      
      const cacheKey = `projects:${page}:${search}`;
      const cached = projectCache.get(cacheKey);
      if (cached) {
        return res.json({
          ...cached,
          cached: true,
          cacheExpiry: projectCache.getTtl(cacheKey)
        });
      }

      // Include both active and error status projects
      const query = { status: { $in: ['active', 'error'] } };
      if (search) {
        query.repositoryUrl = { $regex: search, $options: 'i' };
      }

      const [totalProjects, projects] = await Promise.all([
        Project.countDocuments(query),
        Project.find(query)
          .select('repositoryUrl uploadedBy metadata.language metadata.stars createdAt status')
          .lean()
          .sort({ createdAt: -1 })
          .skip((page - 1) * LIMITS.PAGE_SIZE)
          .limit(LIMITS.PAGE_SIZE)
      ]);

      const response = {
        projects,
        pagination: {
          total: totalProjects,
          pages: Math.ceil(totalProjects / LIMITS.PAGE_SIZE),
          current: page,
          hasMore: page * LIMITS.PAGE_SIZE < totalProjects
        },
        limits: {
          projectsPerUser: LIMITS.PROJECTS_PER_USER,
          cacheTime: CACHE_CONFIG.PROJECTS.TTL
        }
      };

      // Check response size before caching
      const responseSize = Buffer.byteLength(JSON.stringify(response));
      if (responseSize <= CACHE_CONFIG.PROJECTS.MAX_SIZE) {
        projectCache.set(cacheKey, response);
      }

      res.json({
        ...response,
        cached: false
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  },

  // Get user's projects
  async getUserProjects(req, res) {
    try {
      const userId = req.user.id;
      const cacheKey = `user-projects:${userId}`;
      
      // Check cache
      const cached = projectCache.get(cacheKey);
      if (cached) {
        return res.json({
          ...cached,
          cached: true,
          cacheExpiry: projectCache.getTtl(cacheKey)
        });
      }

      // Get user's active projects
      const projects = await Project.find({ 
        userId, 
        status: { $ne: 'archived' } 
      })
      .select('repositoryUrl uploadedBy status createdAt')
      .sort({ createdAt: -1 })
      .lean();

      // Get project limits
      const totalActive = await Project.countDocuments({
        userId,
        status: { $ne: 'archived' }
      });

      const response = {
        projects,
        limits: {
          projectsPerUser: LIMITS.PROJECTS_PER_USER,
          remaining: Math.max(0, LIMITS.PROJECTS_PER_USER - totalActive)
        }
      };

      // Cache the response
      const responseSize = Buffer.byteLength(JSON.stringify(response));
      if (responseSize <= CACHE_CONFIG.PROJECTS.MAX_SIZE) {
        projectCache.set(cacheKey, response);
      }

      res.json({
        ...response,
        cached: false
      });
    } catch (error) {
      console.error('Error fetching user projects:', error);
      res.status(500).json({ error: 'Failed to fetch user projects' });
    }
  },

  // Get project data with caching
  async getProjectData(req, res) {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: 'Repository URL is required' });
    }

    try {
      // Extract owner and repo from URL
      const match = url.match(/github\.com\/([^\/]+)\/([^\/\s]+)/);
      if (!match) {
        return res.status(400).json({ error: 'Invalid GitHub repository URL' });
      }

      const [_, owner, repo] = match;
      const cacheKey = `repo-data:${owner}/${repo}`;

      // Check cache first
      const cachedData = projectDataCache.get(cacheKey);
      if (cachedData) {
        return res.json({
          cached: true,
          cacheExpiry: cachedData.expiry,
          data: cachedData.data
        });
      }

      // Fetch repository data from GitHub
      const octokit = new Octokit({
        auth: process.env.GITHUB_TOKEN
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

      // Cache the result for 1 hour
      projectDataCache.set(cacheKey, {
        data,
        expiry: Date.now() + 3600000 // 1 hour
      });

      res.json({
        cached: false,
        data
      });
    } catch (error) {
      console.error('Error fetching repository data:', error);
      res.status(error.status || 500).json({ 
        error: error.message || 'Failed to fetch repository data'
      });
    }
  },

  // Add project with resource limits
  async addProject(req, res) {
    try {
      const { repositoryUrl } = req.body;
      if (!repositoryUrl) {
        return res.status(400).json({ error: 'Repository URL required' });
      }

      // Check user's project limit
      const userProjectCount = await Project.countDocuments({
        userId: req.user.id,
        status: { $ne: 'archived' }
      });

      if (userProjectCount >= LIMITS.PROJECTS_PER_USER) {
        return res.status(403).json({
          error: 'Project limit reached',
          message: `Free tier allows ${LIMITS.PROJECTS_PER_USER} active projects per user. Please archive old projects first.`,
          current: userProjectCount,
          limit: LIMITS.PROJECTS_PER_USER
        });
      }

      // Check for duplicate
      const existing = await Project.findOne({
        repositoryUrl: { $regex: new RegExp('^' + repositoryUrl + '$', 'i') }
      });

      if (existing) {
        return res.status(409).json({ error: 'Project already exists' });
      }

      // Create project
      const project = await Project.create({
        repositoryUrl,
        userId: req.user.id,
        uploadedBy: req.user.username
      });

      // Clear relevant caches
      projectCache.flushAll();

      res.status(201).json({
        project: {
          id: project._id,
          repositoryUrl: project.repositoryUrl,
          uploadedBy: project.uploadedBy
        },
        limits: {
          projectsPerUser: LIMITS.PROJECTS_PER_USER,
          remaining: LIMITS.PROJECTS_PER_USER - (userProjectCount + 1)
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add project' });
    }
  },

  // Archive project (soft delete)
  async deleteProject(req, res) {
    try {
      const project = await Project.findOneAndUpdate(
        { _id: req.params.id, userId: req.user.id },
        { status: 'archived' },
        { new: true }
      );

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Clear relevant caches
      projectCache.flushAll();
      projectDataCache.del(`data:${project.repositoryUrl}`);

      res.json({
        message: 'Project archived successfully',
        note: 'Archived projects don\'t count towards your limit'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to archive project' });
    }
  },

  // Get file tree with depth and size limits
  async getFileTree(req, res) {
    try {
      const { url } = req.query;
      if (!url) {
        return res.status(400).json({ error: 'Repository URL required' });
      }

      const tree = await githubService.getFileTree(url);
      const limitedTree = limitTreeDepth(tree, LIMITS.MAX_TREE_DEPTH, LIMITS.MAX_FILES);

      res.json({
        tree: limitedTree,
        limits: {
          maxDepth: LIMITS.MAX_TREE_DEPTH,
          maxFiles: LIMITS.MAX_FILES
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch file tree' });
    }
  }
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