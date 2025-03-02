const axios = require('axios');
const PQueue = require('p-queue').default;
const cacheService = require('./cacheService');

/**
 * Configuration
 */
const CONFIG = {
  RATE_LIMIT: {
    WARNING: 4000,      // Warn at 4000 requests (80% of limit)
    RESET: 3600000,     // Reset counter every hour
    MIN_REMAINING: 100  // Minimum remaining calls before throttling
  },
  QUEUE: {
    CONCURRENCY: 2,     // Process 2 requests at a time
    TIMEOUT: 30000,     // 30 second timeout per request
    RETRY: 3           // Retry failed requests 3 times
  }
};

/**
 * GitHub API Service
 * Optimized with caching and rate limiting
 */
class GitHubService {
  constructor() {
    // Initialize request queue
    this.queue = new PQueue({ 
      concurrency: CONFIG.QUEUE.CONCURRENCY,
      timeout: CONFIG.QUEUE.TIMEOUT
    });

    // Rate limit tracking
    this.apiCalls = 0;
    this.lastReset = Date.now();
    this.rateLimitRemaining = 5000; // GitHub's default limit

    // Reset counter hourly
    setInterval(() => {
      this.apiCalls = 0;
      this.lastReset = Date.now();
    }, CONFIG.RATE_LIMIT.RESET);
  }

  /**
   * Core API request method with retries and rate limiting
   */
  async makeRequest(endpoint, options = {}) {
    // Check cache first
    const cacheKey = `github:${endpoint}:${JSON.stringify(options)}`;
    const cachedResponse = cacheService.getRepoData(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Check rate limits
    if (this.rateLimitRemaining < CONFIG.RATE_LIMIT.MIN_REMAINING) {
      console.warn(`GitHub API rate limit low: ${this.rateLimitRemaining} remaining`);
      throw new Error('Rate limit approaching, request queued');
    }

    let retries = 0;
    while (retries < CONFIG.QUEUE.RETRY) {
      try {
        const response = await axios({
          url: `https://api.github.com${endpoint}`,
          headers: {
            'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
          },
          ...options
        });

        // Update rate limit info
        this.rateLimitRemaining = parseInt(response.headers['x-ratelimit-remaining'] || this.rateLimitRemaining);
        this.apiCalls++;

        // Cache successful response
        cacheService.setRepoData(cacheKey, response.data);
        
        return response.data;
      } catch (error) {
        retries++;
        
        // Handle rate limiting
        if (error.response?.status === 403) {
          this.rateLimitRemaining = 0;
          console.error('GitHub API rate limit exceeded');
          throw new Error('Rate limit exceeded');
        }

        // Retry on 5xx errors or network issues
        if (retries < CONFIG.QUEUE.RETRY && 
            (error.response?.status >= 500 || !error.response)) {
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
          continue;
        }

        throw new Error(error.response?.data?.message || 'GitHub API request failed');
      }
    }
  }

  /**
   * Queue non-urgent requests with priority
   */
  queueRequest(endpoint, options = {}, priority = 0) {
    return new Promise((resolve, reject) => {
      const request = async () => {
        try {
          const result = await this.makeRequest(endpoint, options);
          resolve(result);
        } catch (error) {
          if (error.message.includes('Rate limit')) {
            // Requeue with lower priority if rate limited
            this.queueRequest(endpoint, options, priority - 1)
              .then(resolve)
              .catch(reject);
          } else {
            reject(error);
          }
        }
      };

      this.queue.add(request);
      // Sort queue by priority
      this.queue.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    });
  }

  /**
   * Parse and validate GitHub repository URL
   */
  parseRepoUrl(url) {
    try {
      const cleanUrl = url.trim().split('?')[0].replace(/\/$/, '');
      const match = cleanUrl.match(/https?:\/\/(?:www\.)?github\.com\/([^\/]+)\/([^\/\s]+)/);

      if (!match) {
        throw new Error('Invalid GitHub URL. Format: https://github.com/owner/repo');
      }

      return {
        owner: match[1],
        repo: match[2].replace(/\.git$/, '')
      };
    } catch (error) {
      throw new Error('Invalid GitHub repository URL');
    }
  }

  /**
   * Get repository data with caching
   */
  async getRepositoryData(url) {
    // Check cache first
    const cachedData = cacheService.getRepoData(url);
    if (cachedData) {
      return {
        data: cachedData,
        cached: true,
        cacheExpiry: Date.now() + 1800000 // 30 minutes
      };
    }

    // Parse URL
    const { owner, repo } = this.parseRepoUrl(url);
    
    try {
      // Fetch data from GitHub API
      const [repoData, languages] = await Promise.all([
        this.makeRequest(`/repos/${owner}/${repo}`),
        this.makeRequest(`/repos/${owner}/${repo}/languages`)
      ]);

      // Get commit count
      let commitCount = 0;
      try {
        const commitsResponse = await axios({
          url: `https://api.github.com/repos/${owner}/${repo}/commits`,
          headers: {
            'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
          },
          params: { per_page: 1 }
        });

        // Get total commit count from Link header
        const linkHeader = commitsResponse.headers.link;
        if (linkHeader) {
          const matches = linkHeader.match(/page=(\d+)>; rel="last"/);
          if (matches) {
            commitCount = parseInt(matches[1], 10);
          }
        }
      } catch (error) {
        console.error('Error fetching commit count:', error);
      }

      // Combine data
      const data = {
        ...repoData,
        languages,
        commit_count: commitCount
      };

      // Cache the data
      cacheService.setRepoData(url, data);

      return {
        data,
        cached: false
      };
    } catch (error) {
      throw new Error('Failed to fetch repository data: ' + error.message);
    }
  }

  /**
   * Get file tree with caching
   */
  async getFileTree(url) {
    // Check cache first
    const cacheKey = `${url}:tree`;
    const cachedTree = cacheService.getRepoData(cacheKey);
    if (cachedTree) {
      return {
        tree: cachedTree,
        cached: true,
        cacheExpiry: Date.now() + 1800000 // 30 minutes
      };
    }

    // Parse URL
    const { owner, repo } = this.parseRepoUrl(url);
    
    try {
      // Get default branch
      const repoData = await this.makeRequest(`/repos/${owner}/${repo}`);
      
      // Get tree
      const tree = await this.makeRequest(
        `/repos/${owner}/${repo}/git/trees/${repoData.default_branch}`,
        { params: { recursive: 1 } }
      );

      // Process tree
      const processedTree = this.processFileTree(tree.tree, repo);
      
      // Cache the tree
      cacheService.setRepoData(cacheKey, processedTree);

      return {
        tree: processedTree,
        cached: false
      };
    } catch (error) {
      throw new Error('Failed to fetch repository structure: ' + error.message);
    }
  }

  /**
   * Get file content with caching
   */
  async getFileContent(url, path) {
    // Check cache first
    const cachedContent = cacheService.getFileContent(url, path);
    if (cachedContent) {
      return {
        content: cachedContent,
        cached: true,
        cacheExpiry: Date.now() + 3600000 // 1 hour
      };
    }

    // Parse URL
    const { owner, repo } = this.parseRepoUrl(url);
    
    try {
      // Get file content
      const response = await this.makeRequest(
        `/repos/${owner}/${repo}/contents/${path}`
      );

      let content = '';
      if (response.encoding === 'base64') {
        content = Buffer.from(response.content, 'base64').toString('utf-8');
      } else {
        content = response.content;
      }

      // Cache the content
      cacheService.setFileContent(url, path, content);

      return {
        content,
        cached: false
      };
    } catch (error) {
      throw new Error('Failed to fetch file content: ' + error.message);
    }
  }

  /**
   * Helper method to process file tree
   */
  processFileTree(items, rootName) {
    const root = { 
      name: rootName, 
      type: 'tree',
      children: [] 
    };

    const paths = {};
    paths[''] = root;

    items.forEach(item => {
      if (!['blob', 'tree'].includes(item.type)) return;

      const parts = item.path.split('/');
      let currentPath = '';

      parts.forEach((part, i) => {
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (!paths[currentPath]) {
          const node = {
            name: part,
            type: i === parts.length - 1 ? item.type : 'tree',
            path: currentPath,
            children: []
          };

          paths[currentPath] = node;
          paths[parentPath].children.push(node);
        }
      });
    });

    // Sort: directories first, then files
    const sortNode = (node) => {
      if (node.children) {
        node.children.sort((a, b) => {
          if (a.type === b.type) return a.name.localeCompare(b.name);
          return a.type === 'tree' ? -1 : 1;
        });
        node.children.forEach(sortNode);
      }
    };

    sortNode(root);
    return root;
  }
}

// Export singleton instance
module.exports = new GitHubService(); 