const axios = require('axios');
const NodeCache = require('node-cache');
const PQueue = require('p-queue').default;

/**
 * Configuration
 */
const CONFIG = {
  CACHE: {
    TTL: 1800,          // 30 minutes
    CLEANUP: 300,       // 5 minutes
    MAX_SIZE: 500000,   // 500KB max response size
    MAX_KEYS: 1000      // Maximum cached responses
  },
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
 * Optimized for free tier with advanced rate limiting
 */
class GitHubService {
  constructor() {
    // Initialize caching
    this.cache = new NodeCache({ 
      stdTTL: CONFIG.CACHE.TTL,
      checkperiod: CONFIG.CACHE.CLEANUP,
      maxKeys: CONFIG.CACHE.MAX_KEYS,
      useClones: false
    });

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

    // Periodic cache cleanup
    setInterval(() => {
      const keys = this.cache.keys();
      keys.forEach(key => {
        const value = this.cache.get(key);
        if (value) {
          const size = Buffer.byteLength(JSON.stringify(value));
          if (size > CONFIG.CACHE.MAX_SIZE) {
            console.warn(`Removing oversized cache entry: ${key} (${size} bytes)`);
            this.cache.del(key);
          }
        }
      });
    }, CONFIG.CACHE.CLEANUP * 1000);
  }

  /**
   * Core API request method with retries and rate limiting
   */
  async makeRequest(endpoint, options = {}) {
    const cacheKey = `github:${endpoint}${JSON.stringify(options)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

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

        // Cache successful responses if not too large
        if (response.status === 200) {
          const dataSize = Buffer.byteLength(JSON.stringify(response.data));
          if (dataSize < CONFIG.CACHE.MAX_SIZE) {
            this.cache.set(cacheKey, response.data);
          }
        }

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
   * Public API Methods
   */
  async getRepository(owner, repo) {
    return this.makeRequest(`/repos/${owner}/${repo}`);
  }

  async getRepositoryData(url) {
    const { owner, repo } = this.parseRepoUrl(url);
    
    try {
      const [repoData, languages] = await Promise.all([
        this.makeRequest(`/repos/${owner}/${repo}`),
        this.makeRequest(`/repos/${owner}/${repo}/languages`)
      ]);

      return {
        ...repoData,
        languages
      };
    } catch (error) {
      throw new Error('Failed to fetch repository data');
    }
  }

  async getFileTree(url) {
    const { owner, repo } = this.parseRepoUrl(url);
    
    try {
      const repoData = await this.makeRequest(`/repos/${owner}/${repo}`);
      const tree = await this.makeRequest(
        `/repos/${owner}/${repo}/git/trees/${repoData.default_branch}`,
        { params: { recursive: 1 } }
      );

      return this.processFileTree(tree.tree, repo);
    } catch (error) {
      throw new Error('Failed to fetch repository structure');
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