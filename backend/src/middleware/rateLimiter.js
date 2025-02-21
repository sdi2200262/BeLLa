const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');

// Create a cache instance with a TTL of 5 minutes
const cache = new NodeCache({ stdTTL: 300 });

// Rate limiter for GitHub API endpoints
const githubApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests to GitHub API, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Cache middleware
const cacheMiddleware = (duration = 300) => {
  return (req, res, next) => {
    // Skip cache if cache-busting parameter is present
    if (req.query.t) {
      next();
      return;
    }

    // Generate cache key from URL without query parameters
    const urlObj = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);
    const baseUrl = urlObj.pathname;
    const searchParams = new URLSearchParams(urlObj.search);
    searchParams.delete('t'); // Remove cache-busting parameter
    const key = baseUrl + '?' + searchParams.toString();

    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      res.json(cachedResponse);
      return;
    }

    // Store the original json method
    const originalJson = res.json;
    
    // Override the json method
    res.json = function(data) {
      // Store the response in cache
      cache.set(key, data, duration);
      
      // Call the original json method
      return originalJson.call(this, data);
    };

    next();
  };
};

// Helper to clear cache for a specific pattern
const clearCache = (pattern) => {
  const keys = cache.keys();
  keys.forEach(key => {
    if (key.includes(pattern)) {
      cache.del(key);
    }
  });
};

module.exports = {
  githubApiLimiter,
  cacheMiddleware,
  cache,
  clearCache
}; 