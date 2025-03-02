const Project = require('../models/Project');
const githubService = require('../services/githubService');
const cacheService = require('../services/cacheService');

/**
 * Resource Limits
 */
const LIMITS = {
  PAGE_SIZE: 9,           // Projects per page
  MAX_SEARCH_LENGTH: 50,  // Max search query length
  MAX_TREE_DEPTH: 5,      // Max file tree depth
  MAX_FILES: 500         // Max files in response
};

/**
 * Project Controller
 * Simplified to work with minimal Project model and centralized caching
 */
const projectController = {
  // Get all projects
  async getAllProjects(req, res) {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const search = (req.query.search || '').slice(0, LIMITS.MAX_SEARCH_LENGTH);
      
      const cacheKey = `projects:${page}:${search}`;
      const cached = cacheService.getRepoData(cacheKey);
      if (cached) {
        return res.json({
          ...cached,
          cached: true
        });
      }

      // Build query
      const query = {};
      if (search) {
        query.repositoryUrl = { $regex: search, $options: 'i' };
      }

      const [totalProjects, projects] = await Promise.all([
        Project.countDocuments(query),
        Project.find(query)
          .select('repositoryUrl githubUsername createdAt')
          .lean()
          .sort({ createdAt: -1 })
          .skip((page - 1) * LIMITS.PAGE_SIZE)
          .limit(LIMITS.PAGE_SIZE)
      ]);

      // Enhance projects with GitHub data if available
      const enhancedProjects = await Promise.all(
        projects.map(async (project) => {
          try {
            // Check if we have cached GitHub data
            const repoData = cacheService.getRepoData(project.repositoryUrl);
            if (repoData) {
              return {
                ...project,
                githubData: {
                  name: repoData.name,
                  description: repoData.description,
                  stars: repoData.stargazers_count,
                  language: Object.keys(repoData.languages || {})[0] || null
                }
              };
            }
            return project;
          } catch (error) {
            return project;
          }
        })
      );

      const response = {
        projects: enhancedProjects,
        pagination: {
          total: totalProjects,
          pages: Math.ceil(totalProjects / LIMITS.PAGE_SIZE),
          current: page,
          hasMore: page * LIMITS.PAGE_SIZE < totalProjects
        }
      };

      // Cache the response
      cacheService.setRepoData(cacheKey, response, 300); // 5 minutes

      res.json({
        ...response,
        cached: false
      });
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  },

  // Get user's projects
  async getUserProjects(req, res) {
    try {
      // Get GitHub username from query, token, or from GitHub API
      let githubUsername = req.query.githubUsername || req.user?.githubUsername;
      
      if (!githubUsername && req.user && req.user.githubId) {
        // Try to get username from cache
        const userData = cacheService.getUserData(`github_user:${req.user.githubId}`);
        if (userData && userData.login) {
          githubUsername = userData.login;
        } else {
          // Fetch from GitHub API
          const tokenData = cacheService.getUserData(`github_token:${req.user.githubId}`);
          if (tokenData && tokenData.access_token) {
            try {
              const response = await fetch('https://api.github.com/user', {
                headers: {
                  'Authorization': `Bearer ${tokenData.access_token}`,
                  'Accept': 'application/json'
                }
              });
              
              if (response.ok) {
                const userData = await response.json();
                githubUsername = userData.login;
                // Cache the user data
                cacheService.setUserData(`github_user:${req.user.githubId}`, userData, 3600);
              }
            } catch (error) {
              console.error('Error fetching GitHub user data:', error);
            }
          }
        }
      }
      
      if (!githubUsername) {
        return res.status(400).json({ error: 'GitHub username is required' });
      }
      
      const cacheKey = `user-projects:${githubUsername}`;
      const cached = cacheService.getRepoData(cacheKey);
      if (cached) {
        return res.json({
          ...cached,
          cached: true
        });
      }

      // Get user's projects
      const projects = await Project.find({ githubUsername })
        .select('repositoryUrl githubUsername createdAt')
        .sort({ createdAt: -1 })
        .lean();

      // Enhance projects with GitHub data if available
      const enhancedProjects = await Promise.all(
        projects.map(async (project) => {
          try {
            // Check if we have cached GitHub data
            const repoData = cacheService.getRepoData(project.repositoryUrl);
            if (repoData) {
              return {
                ...project,
                githubData: {
                  name: repoData.name,
                  description: repoData.description,
                  stars: repoData.stargazers_count,
                  language: Object.keys(repoData.languages || {})[0] || null
                }
              };
            }
            return project;
          } catch (error) {
            return project;
          }
        })
      );

      const response = {
        projects: enhancedProjects
      };

      // Cache the response
      cacheService.setRepoData(cacheKey, response, 300); // 5 minutes

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
      // Use our githubService to get repository data
      const result = await githubService.getRepositoryData(url);
      
      // Update lastChecked in the database if this is a tracked project
      try {
        await Project.findOneAndUpdate(
          { repositoryUrl: url },
          { lastChecked: new Date() }
        );
      } catch (dbError) {
        console.error('Error updating lastChecked:', dbError);
      }
      
      res.json(result);
    } catch (error) {
      console.error('Error fetching project data:', error);
      res.status(500).json({ error: 'Failed to fetch repository data: ' + error.message });
    }
  },

  // Add a new project
  async addProject(req, res) {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: 'Repository URL is required' });
      }
      
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Get GitHub username from token or from GitHub API
      let githubUsername = req.user.githubUsername;
      
      if (!githubUsername && req.user.githubId) {
        // Try to get username from cache
        const userData = cacheService.getUserData(`github_user:${req.user.githubId}`);
        if (userData && userData.login) {
          githubUsername = userData.login;
        } else {
          // Fetch from GitHub API
          const tokenData = cacheService.getUserData(`github_token:${req.user.githubId}`);
          if (tokenData && tokenData.access_token) {
            try {
              const response = await fetch('https://api.github.com/user', {
                headers: {
                  'Authorization': `Bearer ${tokenData.access_token}`,
                  'Accept': 'application/json'
                }
              });
              
              if (response.ok) {
                const userData = await response.json();
                githubUsername = userData.login;
                // Cache the user data
                cacheService.setUserData(`github_user:${req.user.githubId}`, userData, 3600);
              } else {
                return res.status(400).json({ error: 'Failed to get GitHub username' });
              }
            } catch (error) {
              console.error('Error fetching GitHub user data:', error);
              return res.status(500).json({ error: 'Failed to get GitHub username' });
            }
          } else {
            return res.status(400).json({ error: 'GitHub token not found' });
          }
        }
      }
      
      if (!githubUsername) {
        return res.status(400).json({ error: 'GitHub username is required' });
      }

      // Validate GitHub URL
      try {
        githubService.parseRepoUrl(url);
      } catch (error) {
        return res.status(400).json({ error: error.message });
      }

      // Check if project already exists
      const existingProject = await Project.findOne({ repositoryUrl: url });
      if (existingProject) {
        return res.status(409).json({ error: 'Project already exists' });
      }

      // Create new project
      const project = await Project.create({
        repositoryUrl: url,
        githubUsername
      });

      // Fetch GitHub data in the background
      githubService.getRepositoryData(url).catch(error => {
        console.error('Error fetching initial repository data:', error);
      });

      // Clear user projects cache
      cacheService.clearRepoCache(`user-projects:${githubUsername}`);
      
      res.status(201).json({
        message: 'Project added successfully',
        project: {
          id: project._id,
          repositoryUrl: project.repositoryUrl,
          githubUsername: project.githubUsername,
          createdAt: project.createdAt
        }
      });
    } catch (error) {
      console.error('Error adding project:', error);
      res.status(500).json({ error: 'Failed to add project' });
    }
  },

  // Delete a project
  async deleteProject(req, res) {
    try {
      const { id } = req.params;
      
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Get GitHub username from token or from GitHub API
      let githubUsername = req.user.githubUsername;
      
      if (!githubUsername && req.user.githubId) {
        // Try to get username from cache
        const userData = cacheService.getUserData(`github_user:${req.user.githubId}`);
        if (userData && userData.login) {
          githubUsername = userData.login;
        } else {
          // Fetch from GitHub API
          const tokenData = cacheService.getUserData(`github_token:${req.user.githubId}`);
          if (tokenData && tokenData.access_token) {
            try {
              const response = await fetch('https://api.github.com/user', {
                headers: {
                  'Authorization': `Bearer ${tokenData.access_token}`,
                  'Accept': 'application/json'
                }
              });
              
              if (response.ok) {
                const userData = await response.json();
                githubUsername = userData.login;
                // Cache the user data
                cacheService.setUserData(`github_user:${req.user.githubId}`, userData, 3600);
              } else {
                return res.status(400).json({ error: 'Failed to get GitHub username' });
              }
            } catch (error) {
              console.error('Error fetching GitHub user data:', error);
              return res.status(500).json({ error: 'Failed to get GitHub username' });
            }
          } else {
            return res.status(400).json({ error: 'GitHub token not found' });
          }
        }
      }
      
      if (!githubUsername) {
        return res.status(400).json({ error: 'GitHub username is required' });
      }

      // Find the project
      const project = await Project.findById(id);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Check if user owns the project
      if (project.githubUsername !== githubUsername) {
        return res.status(403).json({ error: 'Not authorized to delete this project' });
      }

      // Hard delete the project
      await Project.deleteOne({ _id: id });

      // Clear caches
      cacheService.clearRepoCache(project.repositoryUrl);
      cacheService.clearRepoCache(`user-projects:${githubUsername}`);
      
      res.json({ message: 'Project deleted successfully' });
    } catch (error) {
      console.error('Error deleting project:', error);
      res.status(500).json({ error: 'Failed to delete project' });
    }
  },

  // Get file tree
  async getFileTree(req, res) {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: 'Repository URL is required' });
    }

    try {
      // Use our githubService to get file tree
      const result = await githubService.getFileTree(url);
      
      // Limit tree depth for performance
      if (result.tree && result.tree.children) {
        result.tree = limitTreeDepth(result.tree, LIMITS.MAX_TREE_DEPTH, LIMITS.MAX_FILES);
      }
      
      res.json(result);
    } catch (error) {
      console.error('Error fetching file tree:', error);
      res.status(500).json({ error: 'Failed to fetch repository structure: ' + error.message });
    }
  },
  
  // Get file content
  async getFileContent(req, res) {
    const { url, path } = req.query;
    if (!url || !path) {
      return res.status(400).json({ error: 'Repository URL and file path are required' });
    }

    try {
      // Use our githubService to get file content
      const result = await githubService.getFileContent(url, path);
      res.json(result);
    } catch (error) {
      console.error('Error fetching file content:', error);
      res.status(500).json({ error: 'Failed to fetch file content: ' + error.message });
    }
  }
};

/**
 * Helper function to limit tree depth and file count
 */
function limitTreeDepth(tree, maxDepth, maxFiles, currentDepth = 0, fileCount = { count: 0 }) {
  if (currentDepth > maxDepth) {
    return {
      name: tree.name,
      type: tree.type,
      path: tree.path,
      truncated: true
    };
  }

  if (tree.type === 'blob') {
    fileCount.count++;
    if (fileCount.count > maxFiles) {
      return null;
    }
    return tree;
  }

  if (!tree.children) {
    return tree;
  }

  const limitedChildren = [];
  for (const child of tree.children) {
    if (fileCount.count > maxFiles) break;
    
    const limitedChild = limitTreeDepth(child, maxDepth, maxFiles, currentDepth + 1, fileCount);
    if (limitedChild) {
      limitedChildren.push(limitedChild);
    }
  }

  return {
    ...tree,
    children: limitedChildren,
    truncated: tree.children.length > limitedChildren.length
  };
}

module.exports = projectController;