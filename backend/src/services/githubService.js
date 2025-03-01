const axios = require('axios');
const NodeCache = require('node-cache');
const PQueue = require('p-queue').default;

/**
 * Configuration
 * Optimized for Render free tier resource constraints
 */
const CONFIG = {
  CACHE: {
    TTL: 3600,          // 60 minutes (increased from 30)
    CLEANUP: 600,       // 10 minutes (increased from 5)
    MAX_SIZE: 250000,   // 250KB max response size (reduced from 500KB)
    MAX_KEYS: 500       // Maximum cached responses (reduced from 1000)
  },
  RATE_LIMIT: {
    WARNING: 3000,      // Warn at 3000 requests (reduced from 4000)
    RESET: 3600000,     // Reset counter every hour
    MIN_REMAINING: 200  // Increased from 100 to be more conservative
  },
  QUEUE: {
    CONCURRENCY: 1,     // Process 1 request at a time (reduced from 2)
    TIMEOUT: 20000,     // 20 second timeout (reduced from 30)
    RETRY: 2            // Retry failed requests 2 times (reduced from 3)
  },
  TREE: {
    MAX_DEPTH: 4,       // Maximum directory depth to process
    MAX_FILES: 300      // Maximum files to include in response
  }
};

/**
 * GitHub API Service
 * Optimized for Render free tier with minimal resource usage
 */
class GitHubService {
  constructor() {
    // Initialize caching with memory optimizations
    this.cache = new NodeCache({ 
      stdTTL: CONFIG.CACHE.TTL,
      checkperiod: CONFIG.CACHE.CLEANUP,
      maxKeys: CONFIG.CACHE.MAX_KEYS,
      useClones: false,    // Don't clone objects (saves memory)
      deleteOnExpire: true // Immediately delete expired items
    });

    // Initialize request queue with lower concurrency
    this.queue = new PQueue({ 
      concurrency: CONFIG.QUEUE.CONCURRENCY,
      timeout: CONFIG.QUEUE.TIMEOUT,
      autoStart: true,
      throwOnTimeout: false
    });

    // Rate limit tracking
    this.apiCalls = 0;
    this.lastReset = Date.now();
    this.rateLimitRemaining = 5000; // GitHub's default limit
    
    // Cache statistics
    this.cacheHits = 0;
    this.cacheMisses = 0;

    // Reset counter hourly
    setInterval(() => {
      this.apiCalls = 0;
      this.lastReset = Date.now();
      
      // Log cache stats hourly
      const hitRatio = this.cacheHits / (this.cacheHits + this.cacheMisses || 1);
      console.log(`GitHub cache stats - Hits: ${this.cacheHits}, Misses: ${this.cacheMisses}, Ratio: ${(hitRatio * 100).toFixed(2)}%`);
    }, CONFIG.RATE_LIMIT.RESET);

    // Periodic cache cleanup (less frequent)
    setInterval(() => {
      // Get cache stats
      const stats = this.cache.getStats();
      console.log(`GitHub cache size: ${stats.keys} keys`);
      
      // Check for oversized entries
      if (stats.keys > CONFIG.CACHE.MAX_KEYS * 0.8) {
        console.warn(`GitHub cache nearing capacity: ${stats.keys}/${CONFIG.CACHE.MAX_KEYS}`);
        this.pruneCache();
      }
    }, CONFIG.CACHE.CLEANUP * 1000);
  }

  /**
   * Prune cache to remove least used entries
   */
  pruneCache() {
    const keys = this.cache.keys();
    // Sort by TTL (remove entries closest to expiration)
    const keysToRemove = keys
      .map(key => ({ 
        key, 
        ttl: this.cache.getTtl(key) || 0 
      }))
      .sort((a, b) => a.ttl - b.ttl)
      .slice(0, Math.floor(keys.length * 0.2))
      .map(item => item.key);
    
    keysToRemove.forEach(key => this.cache.del(key));
    console.log(`Pruned ${keysToRemove.length} entries from GitHub cache`);
  }

  /**
   * Core API request method with retries and rate limiting
   * Optimized for minimal memory usage
   */
  async makeRequest(endpoint, options = {}) {
    // Generate a compact cache key
    const cacheKey = `gh:${endpoint}${JSON.stringify(options || {})}`.slice(0, 100);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.cacheHits++;
      return cached;
    }
    
    this.cacheMisses++;

    // Check rate limits
    if (this.rateLimitRemaining < CONFIG.RATE_LIMIT.MIN_REMAINING) {
      console.warn(`GitHub API rate limit low: ${this.rateLimitRemaining} remaining`);
      throw new Error('Rate limit approaching');
    }

    // Simplified retry logic
    let retries = 0;
    let lastError;
    
    while (retries < CONFIG.QUEUE.RETRY) {
      try {
        // Use axios with timeout
        const response = await axios({
          url: `https://api.github.com${endpoint}`,
          headers: {
            'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'X-GitHub-Api-Version': '2022-11-28'
          },
          timeout: CONFIG.QUEUE.TIMEOUT,
          ...options
        });

        // Update rate limit info
        this.rateLimitRemaining = parseInt(response.headers['x-ratelimit-remaining'] || this.rateLimitRemaining);
        this.apiCalls++;

        // Only cache successful responses that aren't too large
        if (response.status === 200) {
          const dataSize = Buffer.byteLength(JSON.stringify(response.data));
          if (dataSize < CONFIG.CACHE.MAX_SIZE) {
            this.cache.set(cacheKey, response.data);
          }
        }

        return response.data;
      } catch (error) {
        lastError = error;
        retries++;
        
        // Handle rate limiting
        if (error.response?.status === 403 && 
            error.response?.data?.message?.includes('rate limit')) {
          this.rateLimitRemaining = 0;
          console.error('GitHub API rate limit exceeded');
          throw new Error('GitHub API rate limit exceeded');
        }

        // Only retry on server errors or network issues
        if (retries < CONFIG.QUEUE.RETRY && 
            (error.response?.status >= 500 || !error.response)) {
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
          continue;
        }
        
        // Don't retry on 4xx client errors (except rate limiting)
        if (error.response?.status >= 400 && error.response?.status < 500) {
          break;
        }
      }
    }
    
    // Throw the last error with a clear message
    const errorMessage = lastError?.response?.data?.message || 'GitHub API request failed';
    throw new Error(errorMessage);
  }

  /**
   * Parse and validate GitHub repository URL
   * Simplified for better performance
   */
  parseRepoUrl(url) {
    if (!url) throw new Error('Repository URL is required');
    
    try {
      // Remove query params, trailing slashes, and .git extension
      const cleanUrl = url.trim().split('?')[0].replace(/\/$/, '').replace(/\.git$/, '');
      const match = cleanUrl.match(/github\.com\/([^\/]+)\/([^\/\s]+)/);

      if (!match) {
        throw new Error('Invalid GitHub URL format');
      }

      return {
        owner: match[1],
        repo: match[2]
      };
    } catch (error) {
      throw new Error('Invalid GitHub repository URL');
    }
  }

  /**
   * Public API Methods - Simplified for better performance
   */
  
  /**
   * Get basic repository data
   */
  async getRepository(owner, repo) {
    return this.makeRequest(`/repos/${owner}/${repo}`);
  }

  /**
   * Get repository data with languages
   * Memory-optimized to return only essential fields
   */
  async getRepositoryData(url) {
    const { owner, repo } = this.parseRepoUrl(url);
    
    try {
      // Use sequential requests instead of Promise.all to reduce memory usage
      const repoData = await this.makeRequest(`/repos/${owner}/${repo}`);
      
      // Extract only the fields we need
      const essentialData = {
        id: repoData.id,
        name: repoData.name,
        full_name: repoData.full_name,
        description: repoData.description,
        stargazers_count: repoData.stargazers_count,
        forks_count: repoData.forks_count,
        language: repoData.language,
        topics: repoData.topics || [],
        default_branch: repoData.default_branch,
        created_at: repoData.created_at,
        updated_at: repoData.updated_at,
        pushed_at: repoData.pushed_at
      };
      
      // Get languages separately
      const languages = await this.makeRequest(`/repos/${owner}/${repo}/languages`);

      return {
        ...essentialData,
        languages
      };
    } catch (error) {
      console.error('Error fetching repository data:', error.message);
      throw new Error('Failed to fetch repository data');
    }
  }

  /**
   * Get file tree with depth and size limits
   */
  async getFileTree(url) {
    const { owner, repo } = this.parseRepoUrl(url);
    
    try {
      const repoData = await this.makeRequest(`/repos/${owner}/${repo}`);
      const tree = await this.makeRequest(
        `/repos/${owner}/${repo}/git/trees/${repoData.default_branch}`,
        { params: { recursive: 1 } }
      );

      // Process with limits
      return this.processFileTree(tree.tree, repo, CONFIG.TREE.MAX_DEPTH, CONFIG.TREE.MAX_FILES);
    } catch (error) {
      console.error('Error fetching file tree:', error.message);
      throw new Error('Failed to fetch repository structure');
    }
  }

  /**
   * Helper method to process file tree with depth and size limits
   */
  processFileTree(items, rootName, maxDepth = 4, maxFiles = 300) {
    // Create root node
    const root = { 
      name: rootName, 
      type: 'tree',
      children: [] 
    };

    const paths = {};
    paths[''] = root;
    
    // Track file count
    let fileCount = 0;

    // Process only up to maxFiles items
    const limitedItems = items.slice(0, maxFiles * 2); // Process more items than limit to ensure directories are included
    
    limitedItems.forEach(item => {
      // Skip non-standard types
      if (!['blob', 'tree'].includes(item.type)) return;
      
      // Skip if we've reached the file limit
      if (fileCount >= maxFiles && item.type === 'blob') return;
      
      const parts = item.path.split('/');
      
      // Skip if path depth exceeds maxDepth
      if (parts.length > maxDepth) return;
      
      let currentPath = '';

      // Build tree structure
      parts.forEach((part, i) => {
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (!paths[currentPath]) {
          const isLeaf = i === parts.length - 1;
          const nodeType = isLeaf ? item.type : 'tree';
          
          // Create node
          const node = {
            name: part,
            type: nodeType,
            path: currentPath,
            children: nodeType === 'tree' ? [] : undefined
          };

          // Add to parent
          paths[currentPath] = node;
          if (paths[parentPath]) {
            paths[parentPath].children.push(node);
          }
          
          // Increment file count for blobs
          if (nodeType === 'blob') {
            fileCount++;
          }
        }
      });
    });

    // Sort: directories first, then files alphabetically
    const sortNode = (node) => {
      if (node.children && node.children.length > 0) {
        node.children.sort((a, b) => {
          if (a.type === b.type) return a.name.localeCompare(b.name);
          return a.type === 'tree' ? -1 : 1;
        });
        node.children.forEach(sortNode);
      }
    };

    sortNode(root);
    
    // Add metadata about limits
    root.metadata = {
      totalFiles: fileCount,
      maxFiles: maxFiles,
      maxDepth: maxDepth,
      limited: fileCount >= maxFiles
    };
    
    return root;
  }
  
  /**
   * Get contributors for a repository
   * Memory-optimized to return only essential fields
   */
  async getContributors(url, limit = 10) {
    const { owner, repo } = this.parseRepoUrl(url);
    
    try {
      const contributors = await this.makeRequest(
        `/repos/${owner}/${repo}/contributors`,
        { params: { per_page: limit } }
      );
      
      // Return only essential fields
      return contributors.map(c => ({
        username: c.login,
        contributions: c.contributions,
        avatar: c.avatar_url
      }));
    } catch (error) {
      console.error('Error fetching contributors:', error.message);
      throw new Error('Failed to fetch contributors');
    }
  }
}

// Export singleton instance
module.exports = new GitHubService(); 