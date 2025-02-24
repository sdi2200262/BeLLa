const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');

/**
 * Rate Limiting Configuration
 * Optimized for free tier and abuse prevention
 */
const RATE_LIMITS = {
  GLOBAL: {
    WINDOW_MS: 60 * 60 * 1000,  // 1 hour
    MAX: 300                     // 300 requests per hour
  },
  BURST: {
    WINDOW_MS: 5000,            // 5 seconds
    MAX: 10                     // 10 requests per 5 seconds
  },
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000,  // 15 minutes
    MAX: 5                      // 5 login attempts
  },
  GITHUB: {
    WINDOW_MS: 60 * 60 * 1000,  // 1 hour
    MAX: 50                     // 50 GitHub API requests
  }
};

/**
 * Abuse Detection Configuration
 */
const ABUSE_CONFIG = {
  TTL: 3600,                    // 1 hour tracking
  WARNING_THRESHOLD: 3,         // Warnings before block
  BLOCK_DURATION: {
    FIRST: 30 * 60 * 1000,     // 30 minutes
    SECOND: 2 * 60 * 60 * 1000, // 2 hours
    THIRD: 24 * 60 * 60 * 1000  // 24 hours
  },
  CLEANUP_INTERVAL: 900000,     // Clean old records every 15 minutes
  MAX_RECORDS: 10000           // Maximum number of tracked IPs
};

// Initialize abuse tracking cache
const abuseCache = new NodeCache({
  stdTTL: ABUSE_CONFIG.TTL,
  checkperiod: 300,
  useClones: false,
  maxKeys: ABUSE_CONFIG.MAX_RECORDS
});

// Periodic cleanup of old records
setInterval(() => {
  const stats = abuseCache.getStats();
  if (stats.keys > ABUSE_CONFIG.MAX_RECORDS * 0.8) {
    console.warn(`Abuse cache nearing capacity: ${stats.keys}/${ABUSE_CONFIG.MAX_RECORDS}`);
    const keys = abuseCache.keys();
    const oldestKeys = keys
      .map(key => ({ key, data: abuseCache.get(key) }))
      .sort((a, b) => a.data.lastRequest - b.data.lastRequest)
      .slice(0, Math.floor(keys.length * 0.2))
      .map(item => item.key);
    
    oldestKeys.forEach(key => abuseCache.del(key));
  }
}, ABUSE_CONFIG.CLEANUP_INTERVAL);

/**
 * Track suspicious activity with user context
 */
function trackSuspiciousActivity(req) {
  const now = Date.now();
  const ipKey = `ip:${req.ip}`;
  const userKey = req.user ? `user:${req.user.id}` : null;

  // Get or initialize records
  const ipRecord = abuseCache.get(ipKey) || {
    burstCount: 0,
    warnings: 0,
    lastRequest: now,
    blockHistory: [],
    userIds: new Set()
  };

  // Update user tracking
  if (req.user) {
    ipRecord.userIds.add(req.user.id);
    
    // If this IP is associated with too many users, it's suspicious
    if (ipRecord.userIds.size > 5) {
      ipRecord.warnings++;
      console.warn(`Suspicious multi-user activity from IP ${req.ip}`);
    }
  }

  // Update burst count
  if (now - ipRecord.lastRequest < RATE_LIMITS.BURST.WINDOW_MS) {
    ipRecord.burstCount++;
  } else {
    ipRecord.burstCount = 1;
  }

  // Check for burst abuse
  if (ipRecord.burstCount > RATE_LIMITS.BURST.MAX) {
    ipRecord.warnings++;
    console.warn(`Burst abuse from ${req.ip}: ${ipRecord.burstCount} requests in 5s`);
  }

  // Apply progressive blocking
  if (ipRecord.warnings >= ABUSE_CONFIG.WARNING_THRESHOLD) {
    const blockCount = ipRecord.blockHistory.length;
    const blockDuration = blockCount === 0 ? ABUSE_CONFIG.BLOCK_DURATION.FIRST :
                         blockCount === 1 ? ABUSE_CONFIG.BLOCK_DURATION.SECOND :
                         ABUSE_CONFIG.BLOCK_DURATION.THIRD;

    ipRecord.blocked = true;
    ipRecord.blockedUntil = now + blockDuration;
    ipRecord.blockHistory.push(now);

    // Also block associated user IDs
    if (ipRecord.userIds.size > 0) {
      Array.from(ipRecord.userIds).forEach(userId => {
        abuseCache.set(`user:${userId}`, {
          blocked: true,
          blockedUntil: ipRecord.blockedUntil,
          reason: 'Associated with blocked IP'
        });
      });
    }
  }

  ipRecord.lastRequest = now;
  abuseCache.set(ipKey, ipRecord);
  return ipRecord;
}

/**
 * Anti-abuse middleware with user context
 */
const antiAbuse = (req, res, next) => {
  const ipRecord = trackSuspiciousActivity(req);
  const userRecord = req.user ? abuseCache.get(`user:${req.user.id}`) : null;

  if ((ipRecord.blocked && Date.now() < ipRecord.blockedUntil) ||
      (userRecord?.blocked && Date.now() < userRecord.blockedUntil)) {
    const record = ipRecord.blocked ? ipRecord : userRecord;
    const remainingMinutes = Math.ceil((record.blockedUntil - Date.now()) / 60000);
    
    return res.status(429).json({
      error: 'Too Many Requests',
      message: `Access blocked for ${remainingMinutes} minutes due to suspicious activity`,
      retryAfter: Math.ceil((record.blockedUntil - Date.now()) / 1000)
    });
  }

  next();
};

/**
 * Rate limiters
 */
const rateLimiters = {
  // Global rate limiter
  global: rateLimit({
    windowMs: RATE_LIMITS.GLOBAL.WINDOW_MS,
    max: RATE_LIMITS.GLOBAL.MAX,
    message: {
      error: 'Too Many Requests',
      message: 'Please try again in an hour'
    },
    skip: (req) => req.path === '/health'
  }),

  // Burst rate limiter
  burst: rateLimit({
    windowMs: RATE_LIMITS.BURST.WINDOW_MS,
    max: RATE_LIMITS.BURST.MAX,
    message: {
      error: 'Too Many Requests',
      message: 'Please slow down'
    }
  }),

  // Auth rate limiter
  auth: rateLimit({
    windowMs: RATE_LIMITS.AUTH.WINDOW_MS,
    max: RATE_LIMITS.AUTH.MAX,
    message: {
      error: 'Too Many Attempts',
      message: 'Please try again in 15 minutes'
    }
  }),

  // GitHub API rate limiter
  github: rateLimit({
    windowMs: RATE_LIMITS.GITHUB.WINDOW_MS,
    max: RATE_LIMITS.GITHUB.MAX,
    message: {
      error: 'GitHub API Limit Reached',
      message: 'Please try again in an hour'
    }
  })
};

/**
 * Response caching middleware
 */
const responseCache = new NodeCache({
  stdTTL: 300,  // 5 minutes default TTL
  maxKeys: 1000 // Limit total cached responses
});

const cacheMiddleware = (duration = 300) => (req, res, next) => {
  if (req.method !== 'GET') return next();

  const key = `${req.method}:${req.originalUrl}`;
  const cached = responseCache.get(key);

  if (cached) {
    return res.json(cached);
  }

  const originalJson = res.json;
  res.json = function(data) {
    if (res.statusCode === 200) {
      responseCache.set(key, data, duration);
    }
    return originalJson.call(this, data);
  };

  next();
};

module.exports = {
  antiAbuse,
  rateLimiters,
  cacheMiddleware,
  responseCache
}; 