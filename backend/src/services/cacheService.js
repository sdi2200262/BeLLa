const NodeCache = require('node-cache');

/**
 * Cache Service
 * Provides a centralized caching mechanism for GitHub data
 */
class CacheService {
  constructor() {
    // Cache for repository data (30 minute TTL)
    this.repoCache = new NodeCache({
      stdTTL: 1800, // 30 minutes
      checkperiod: 600, // Check for expired keys every 10 minutes
      maxKeys: 1000 // Maximum number of cached repositories
    });

    // Cache for file content (1 hour TTL)
    this.fileCache = new NodeCache({
      stdTTL: 3600, // 1 hour
      checkperiod: 600, // Check for expired keys every 10 minutes
      maxKeys: 500 // Maximum number of cached files
    });

    // Cache for user data (1 day TTL)
    this.userCache = new NodeCache({
      stdTTL: 86400, // 24 hours
      checkperiod: 3600, // Check for expired keys every hour
      maxKeys: 500 // Maximum number of cached users
    });
  }

  /**
   * Get repository data from cache
   * @param {string} repoUrl - GitHub repository URL
   * @returns {Object|null} - Cached repository data or null
   */
  getRepoData(repoUrl) {
    return this.repoCache.get(this._normalizeRepoUrl(repoUrl));
  }

  /**
   * Set repository data in cache
   * @param {string} repoUrl - GitHub repository URL
   * @param {Object} data - Repository data to cache
   * @param {number} ttl - Optional custom TTL in seconds
   */
  setRepoData(repoUrl, data, ttl = 1800) {
    this.repoCache.set(this._normalizeRepoUrl(repoUrl), data, ttl);
  }

  /**
   * Get file content from cache
   * @param {string} repoUrl - GitHub repository URL
   * @param {string} path - File path
   * @returns {string|null} - Cached file content or null
   */
  getFileContent(repoUrl, path) {
    return this.fileCache.get(`${this._normalizeRepoUrl(repoUrl)}:${path}`);
  }

  /**
   * Set file content in cache
   * @param {string} repoUrl - GitHub repository URL
   * @param {string} path - File path
   * @param {string} content - File content to cache
   * @param {number} ttl - Optional custom TTL in seconds
   */
  setFileContent(repoUrl, path, content, ttl = 3600) {
    this.fileCache.set(`${this._normalizeRepoUrl(repoUrl)}:${path}`, content, ttl);
  }

  /**
   * Get user data from cache
   * @param {string} githubId - GitHub user ID
   * @returns {Object|null} - Cached user data or null
   */
  getUserData(githubId) {
    return this.userCache.get(githubId);
  }

  /**
   * Set user data in cache
   * @param {string} githubId - GitHub user ID
   * @param {Object} data - User data to cache
   * @param {number} ttl - Optional custom TTL in seconds
   */
  setUserData(githubId, data, ttl = 86400) {
    this.userCache.set(githubId, data, ttl);
  }

  /**
   * Clear cache for a specific repository
   * @param {string} repoUrl - GitHub repository URL
   */
  clearRepoCache(repoUrl) {
    const normalizedUrl = this._normalizeRepoUrl(repoUrl);
    this.repoCache.del(normalizedUrl);
    
    // Also clear file cache for this repo
    const fileKeys = this.fileCache.keys().filter(key => 
      key.startsWith(`${normalizedUrl}:`)
    );
    fileKeys.forEach(key => this.fileCache.del(key));
  }

  /**
   * Clear cache for a specific user
   * @param {string} githubId - GitHub user ID
   */
  clearUserCache(githubId) {
    this.userCache.del(githubId);
  }

  /**
   * Clear all caches
   */
  clearAllCaches() {
    this.repoCache.flushAll();
    this.fileCache.flushAll();
    this.userCache.flushAll();
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache statistics
   */
  getStats() {
    return {
      repo: this.repoCache.getStats(),
      file: this.fileCache.getStats(),
      user: this.userCache.getStats()
    };
  }

  /**
   * Normalize repository URL for consistent cache keys
   * @private
   * @param {string} url - GitHub repository URL
   * @returns {string} - Normalized URL
   */
  _normalizeRepoUrl(url) {
    return url.trim().toLowerCase().replace(/\/$/, '');
  }
}

// Export singleton instance
module.exports = new CacheService(); 