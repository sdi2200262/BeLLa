const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');

/**
 * Rate Limiting Configuration
 * Optimized for Render free tier resource constraints
 */
const RATE_LIMITS = {
  GLOBAL: {
    WINDOW_MS: 60 * 60 * 1000,  // 1 hour
    MAX: 200                    // Reduced from 300 to 200 requests per hour
  },
  BURST: {
    WINDOW_MS: 10000,           // Increased from 5s to 10s
    MAX: 8                      // Reduced from 10 to 8 requests per 10 seconds
  },
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000,  // 15 minutes
    MAX: 5                      // 5 login attempts
  },
  GITHUB: {
    WINDOW_MS: 60 * 60 * 1000,  // 1 hour
    MAX: 30                     // Reduced from 50 to 30 GitHub API requests
  }
};

/**
 * Abuse Detection Configuration
 * Optimized for lower memory usage
 */
const ABUSE_CONFIG = {
  TTL: 3600,                    // 1 hour tracking
  WARNING_THRESHOLD: 3,         // Warnings before block
  BLOCK_DURATION: {
    FIRST: 30 * 60 * 1000,      // 30 minutes
    SECOND: 2 * 60 * 60 * 1000, // 2 hours
    THIRD: 24 * 60 * 60 * 1000  // 24 hours
  },
  CLEANUP_INTERVAL: 1800000,    // Increased from 15 to 30 minutes
  MAX_RECORDS: 5000             // Reduced from 10000 to 5000
};

// Initialize abuse tracking cache with memory optimizations
const abuseCache = new NodeCache({
  stdTTL: ABUSE_CONFIG.TTL,
  checkperiod: 600,             // Increased from 300 to 600 seconds
  useClones: false,             // Don't clone objects (saves memory)
  maxKeys: ABUSE_CONFIG.MAX_RECORDS
});

// Periodic cleanup of old records (less frequent)
setInterval(() => {
  const stats = abuseCache.getStats();
  if (stats.keys > ABUSE_CONFIG.MAX_RECORDS * 0.7) { // Trigger earlier at 70% capacity
    console.warn(`Abuse cache nearing capacity: ${stats.keys}/${ABUSE_CONFIG.MAX_RECORDS}`);
    const keys = abuseCache.keys();
    const oldestKeys = keys
      .map(key => ({ key, data: abuseCache.get(key) }))
      .sort((a, b) => a.data.lastRequest - b.data.lastRequest)
      .slice(0, Math.floor(keys.length * 0.3)) // Remove 30% instead of 20%
      .map(item => item.key);
    
    oldestKeys.forEach(key => abuseCache.del(key));
    console.log(`Cleaned ${oldestKeys.length} old abuse records`);
  }
}, ABUSE_CONFIG.CLEANUP_INTERVAL);

/**
 * Track suspicious activity with optimized data storage
 */
function trackSuspiciousActivity(req) {
  const now = Date.now();
  const ipKey = `ip:${req.ip}`;
  
  // Get or initialize records with minimal data structure
  const ipRecord = abuseCache.get(ipKey) || {
    b: 0,                // burstCount (shortened key)
    w: 0,                // warnings (shortened key)
    l: now,              // lastRequest (shortened key)
    h: [],               // blockHistory (shortened key)
    u: new Set()         // userIds (shortened key)
  };

  // Update user tracking (only if authenticated)
  if (req.user?.id) {
    ipRecord.u.add(req.user.id);
    
    // If this IP is associated with too many users, it's suspicious
    if (ipRecord.u.size > 5) {
      ipRecord.w++;
      console.warn(`Suspicious multi-user activity from IP ${req.ip}`);
    }
  }

  // Update burst count
  if (now - ipRecord.l < RATE_LIMITS.BURST.WINDOW_MS) {
    ipRecord.b++;
  } else {
    ipRecord.b = 1;
  }

  // Check for burst abuse
  if (ipRecord.b > RATE_LIMITS.BURST.MAX) {
    ipRecord.w++;
    console.warn(`Burst abuse from ${req.ip}: ${ipRecord.b} requests in ${RATE_LIMITS.BURST.WINDOW_MS/1000}s`);
  }

  // Apply progressive blocking
  if (ipRecord.w >= ABUSE_CONFIG.WARNING_THRESHOLD) {
    const blockCount = ipRecord.h.length;
    const blockDuration = blockCount === 0 ? ABUSE_CONFIG.BLOCK_DURATION.FIRST :
                         blockCount === 1 ? ABUSE_CONFIG.BLOCK_DURATION.SECOND :
                         ABUSE_CONFIG.BLOCK_DURATION.THIRD;

    ipRecord.blocked = true;
    ipRecord.until = now + blockDuration; // shortened key
    ipRecord.h.push(now);

    // Also block associated user IDs (limit to 10 most recent)
    if (ipRecord.u.size > 0) {
      Array.from(ipRecord.u).slice(-10).forEach(userId => {
        abuseCache.set(`user:${userId}`, {
          blocked: true,
          until: ipRecord.until,
          reason: 'ip'  // shortened reason
        });
      });
    }
  }

  ipRecord.l = now;
  abuseCache.set(ipKey, ipRecord);
  return ipRecord;
}

/**
 * Anti-abuse middleware with optimized processing
 */
const antiAbuse = (req, res, next) => {
  // Skip for health checks and static resources
  if (req.path === '/health' || req.path.startsWith('/static/')) {
    return next();
  }

  const ipRecord = trackSuspiciousActivity(req);
  const userRecord = req.user?.id ? abuseCache.get(`user:${req.user.id}`) : null;

  if ((ipRecord.blocked && Date.now() < ipRecord.until) ||
      (userRecord?.blocked && Date.now() < userRecord.until)) {
    const record = ipRecord.blocked ? ipRecord : userRecord;
    const remainingMinutes = Math.ceil((record.until - Date.now()) / 60000);
    
    return res.status(429).json({
      error: 'Too Many Requests',
      retryAfter: Math.ceil((record.until - Date.now()) / 1000)
    });
  }

  next();
};

/**
 * Rate limiters with optimized settings for Render free tier
 */
const rateLimiters = {
  // Global rate limiter
  global: rateLimit({
    windowMs: RATE_LIMITS.GLOBAL.WINDOW_MS,
    max: RATE_LIMITS.GLOBAL.MAX,
    message: {
      error: 'Too Many Requests'
    },
    skip: (req) => req.path === '/health' || req.path.startsWith('/static/'),
    standardHeaders: false,     // Disable rate limit info headers
    legacyHeaders: false        // Disable X-RateLimit headers
  }),

  // Burst rate limiter
  burst: rateLimit({
    windowMs: RATE_LIMITS.BURST.WINDOW_MS,
    max: RATE_LIMITS.BURST.MAX,
    message: {
      error: 'Too Many Requests'
    },
    skip: (req) => req.path === '/health' || req.path.startsWith('/static/'),
    standardHeaders: false,
    legacyHeaders: false
  }),

  // Auth rate limiter
  auth: rateLimit({
    windowMs: RATE_LIMITS.AUTH.WINDOW_MS,
    max: RATE_LIMITS.AUTH.MAX,
    message: {
      error: 'Too Many Attempts'
    },
    standardHeaders: false,
    legacyHeaders: false
  }),

  // GitHub API rate limiter
  github: rateLimit({
    windowMs: RATE_LIMITS.GITHUB.WINDOW_MS,
    max: RATE_LIMITS.GITHUB.MAX,
    message: {
      error: 'GitHub API Limit Reached'
    },
    standardHeaders: false,
    legacyHeaders: false
  })
};

/**
 * Response caching middleware with memory optimizations
 */
const responseCache = new NodeCache({
  stdTTL: 600,  // 10 minutes (increased from 5)
  maxKeys: 500, // Reduced from 1000 to 500
  checkperiod: 300, // Check every 5 minutes
  useClones: false  // Don't clone objects (saves memory)
});

/**
 * Memory-efficient caching middleware
 */
const cacheMiddleware = (duration = 600) => (req, res, next) => {
  // Skip caching for non-GET requests or authenticated routes
  if (req.method !== 'GET' || req.user) return next();

  // Skip caching for certain paths
  if (req.path.includes('/auth/') || req.path === '/health') {
    return next();
  }

  const key = `${req.originalUrl}`;
  const cached = responseCache.get(key);

  if (cached) {
    return res.json(cached);
  }

  // Store original json method
  const originalJson = res.json;
  
  // Override json method to cache responses
  res.json = function(data) {
    if (res.statusCode === 200) {
      // Only cache if response size is reasonable (< 50KB)
      const dataSize = Buffer.byteLength(JSON.stringify(data));
      if (dataSize < 50000) {
        responseCache.set(key, data, duration);
      }
    }
    return originalJson.call(this, data);
  };

  next();
};

// Periodic cache cleanup
setInterval(() => {
  const stats = responseCache.getStats();
  console.log(`Response cache stats: ${stats.keys} keys, ${stats.hits} hits, ${stats.misses} misses`);
  
  // If hit ratio is low, flush the cache
  if (stats.hits + stats.misses > 1000 && stats.hits / (stats.hits + stats.misses) < 0.3) {
    console.log('Low cache hit ratio, flushing response cache');
    responseCache.flushAll();
  }
}, 3600000); // Check every hour

/**
 * Global rate limiter for all routes
 * Used in index.js as the main application rate limiter
 */
const globalRateLimiter = (req, res, next) => {
  // Skip for health checks and static resources
  if (req.path === '/health' || req.path.startsWith('/static/')) {
    return next();
  }

  const ip = req.ip || req.connection.remoteAddress;
  
  // Check if IP is blocked globally
  if (isIPBlocked(ip)) {
    return res.status(429).json({
      error: 'Too many requests',
      message: 'Please try again later'
    });
  }

  // Apply standard rate limiting
  const now = Date.now();
  const hour = Math.floor(now / 3600000);
  const key = `global:${ip}:${hour}`;
  
  const count = (ipRecords[ip]?.requests || 0) + 1;
  
  if (count > CONFIG.GLOBAL.MAX) {
    // Block IP for excessive requests
    blockIP(ip, 'Exceeded global rate limit', CONFIG.GLOBAL.BLOCK_DURATION);
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests, please try again later'
    });
  }
  
  // Update request count
  if (!ipRecords[ip]) {
    ipRecords[ip] = { requests: 1, warnings: 0, lastRequest: now };
  } else {
    ipRecords[ip].requests = count;
    ipRecords[ip].lastRequest = now;
  }
  
  next();
};

/**
 * Rate limiter middleware factory
 * Returns the appropriate rate limiter based on the type
 * @param {string} type - The type of rate limiter to use (standard, github, auth)
 * @returns {Function} The rate limiter middleware
 */
const rateLimiter = (type = 'standard') => {
  switch (type) {
    case 'github':
      return rateLimiters.github;
    case 'auth':
      return rateLimiters.auth;
    case 'burst':
      return rateLimiters.burst;
    case 'standard':
    default:
      return rateLimiters.global;
  }
};

module.exports = {
  rateLimiter,
  globalRateLimiter,
  cacheResponse: cacheMiddleware
}; 