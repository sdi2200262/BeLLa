/**
 * Cache Service
 * Centralized caching system for the application
 */

const NodeCache = require('node-cache');
const { CACHE_CONFIG } = require('../config/config');

/**
 * Cache instances for different data types
 */
const caches = {
  // Authentication token cache
  token: new NodeCache({
    stdTTL: CACHE_CONFIG.TOKEN.TTL,
    checkperiod: Math.floor(CACHE_CONFIG.TOKEN.TTL / 10),
    maxKeys: CACHE_CONFIG.TOKEN.MAX_KEYS,
    useClones: false
  }),

  // GitHub API response cache
  github: new NodeCache({
    stdTTL: CACHE_CONFIG.GITHUB.TTL,
    checkperiod: Math.floor(CACHE_CONFIG.GITHUB.TTL / 10),
    maxKeys: CACHE_CONFIG.GITHUB.MAX_KEYS,
    useClones: false
  }),

  // Project list cache
  projects: new NodeCache({
    stdTTL: CACHE_CONFIG.PROJECTS.TTL,
    checkperiod: Math.floor(CACHE_CONFIG.PROJECTS.TTL / 10),
    maxKeys: CACHE_CONFIG.PROJECTS.MAX_KEYS,
    useClones: false
  }),

  // Project data cache
  projectData: new NodeCache({
    stdTTL: CACHE_CONFIG.PROJECT_DATA.TTL,
    checkperiod: Math.floor(CACHE_CONFIG.PROJECT_DATA.TTL / 10),
    maxKeys: CACHE_CONFIG.PROJECT_DATA.MAX_KEYS,
    useClones: false
  })
};

/**
 * Cache size monitoring and cleanup
 */
function startCacheMonitoring() {
  setInterval(() => {
    // Check and clean project caches
    [
      { cache: caches.projects, config: CACHE_CONFIG.PROJECTS },
      { cache: caches.projectData, config: CACHE_CONFIG.PROJECT_DATA }
    ].forEach(({ cache, config }) => {
      const keys = cache.keys();
      keys.forEach(key => {
        const value = cache.get(key);
        if (!value) return;
        
        const size = Buffer.byteLength(JSON.stringify(value));
        if (size > config.MAX_SIZE) {
          console.warn(`Removing oversized cache entry: ${key} (${size} bytes)`);
          cache.del(key);
        }
      });
    });

    // Log cache stats in development
    if (process.env.NODE_ENV !== 'production') {
      Object.entries(caches).forEach(([name, cache]) => {
        console.debug(`Cache ${name}: ${cache.keys().length} items`);
      });
    }
  }, CACHE_CONFIG.CLEANUP_INTERVAL);
}

/**
 * Cache Service API
 */
const cacheService = {
  /**
   * Initialize cache monitoring
   */
  init() {
    startCacheMonitoring();
    return this;
  },

  /**
   * Get item from cache
   * @param {string} cacheType - Cache type (token, github, projects, projectData)
   * @param {string} key - Cache key
   * @returns {any} Cached value or undefined
   */
  get(cacheType, key) {
    if (!caches[cacheType]) {
      console.error(`Invalid cache type: ${cacheType}`);
      return undefined;
    }
    return caches[cacheType].get(key);
  },

  /**
   * Set item in cache
   * @param {string} cacheType - Cache type (token, github, projects, projectData)
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Optional TTL in seconds
   * @returns {boolean} Success
   */
  set(cacheType, key, value, ttl) {
    if (!caches[cacheType]) {
      console.error(`Invalid cache type: ${cacheType}`);
      return false;
    }
    return caches[cacheType].set(key, value, ttl);
  },

  /**
   * Delete item from cache
   * @param {string} cacheType - Cache type (token, github, projects, projectData)
   * @param {string} key - Cache key
   * @returns {number} Number of deleted entries
   */
  del(cacheType, key) {
    if (!caches[cacheType]) {
      console.error(`Invalid cache type: ${cacheType}`);
      return 0;
    }
    return caches[cacheType].del(key);
  },

  /**
   * Check if key exists in cache
   * @param {string} cacheType - Cache type (token, github, projects, projectData)
   * @param {string} key - Cache key
   * @returns {boolean} True if key exists
   */
  has(cacheType, key) {
    if (!caches[cacheType]) {
      console.error(`Invalid cache type: ${cacheType}`);
      return false;
    }
    return caches[cacheType].has(key);
  },

  /**
   * Get TTL for key
   * @param {string} cacheType - Cache type (token, github, projects, projectData)
   * @param {string} key - Cache key
   * @returns {number} TTL in seconds
   */
  getTtl(cacheType, key) {
    if (!caches[cacheType]) {
      console.error(`Invalid cache type: ${cacheType}`);
      return 0;
    }
    return caches[cacheType].getTtl(key);
  },

  /**
   * Flush specific cache
   * @param {string} cacheType - Cache type (token, github, projects, projectData)
   * @returns {void}
   */
  flush(cacheType) {
    if (!caches[cacheType]) {
      console.error(`Invalid cache type: ${cacheType}`);
      return;
    }
    caches[cacheType].flushAll();
  },

  /**
   * Flush all caches
   * @returns {void}
   */
  flushAll() {
    Object.values(caches).forEach(cache => cache.flushAll());
  }
};

module.exports = cacheService.init(); 