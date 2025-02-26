/**
 * Rate Limiter Middleware
 * Handles request rate limiting and abuse prevention
 */

const rateLimit = require('express-rate-limit');
const { RATE_LIMITS, ABUSE_CONFIG } = require('../config/config');
const cacheService = require('../services/cacheService');
const { ApiError } = require('./errorHandler');

// Initialize abuse tracking cache
const abuseCache = new Map();

// Periodic cleanup of old abuse records
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of abuseCache.entries()) {
    if (now - data.lastAttempt > ABUSE_CONFIG.TTL * 1000) {
      abuseCache.delete(ip);
    }
  }
}, ABUSE_CONFIG.CLEANUP_INTERVAL);

/**
 * Custom handler for rate limit responses that preserves CORS headers
 */
const createRateLimitHandler = (message, details) => {
  return (req, res, next) => {
    // Set CORS headers to ensure they're present even in error responses
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, Accept');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // For preflight requests, respond with 200 OK even when rate limited
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // For regular requests, proceed with rate limit error
    next(ApiError.tooManyRequests(message, details));
  };
};

/**
 * Standard rate limiter for most API endpoints
 */
const standardLimiter = rateLimit({
  windowMs: RATE_LIMITS.GLOBAL.WINDOW_MS,
  max: RATE_LIMITS.GLOBAL.MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests',
    message: 'Please try again later'
  },
  skip: (req) => req.path === '/health',
  handler: createRateLimitHandler('Too many requests', 'Please try again later')
});

/**
 * Strict rate limiter for authentication endpoints
 */
const authLimiter = rateLimit({
  windowMs: RATE_LIMITS.AUTH.WINDOW_MS,
  max: RATE_LIMITS.AUTH.MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many login attempts',
    message: 'Please try again in 15 minutes'
  },
  handler: createRateLimitHandler('Too many login attempts', 'Please try again in 15 minutes')
});

/**
 * Burst rate limiter to prevent rapid-fire requests
 */
const burstLimiter = rateLimit({
  windowMs: RATE_LIMITS.BURST.WINDOW_MS,
  max: RATE_LIMITS.BURST.MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Request rate too high',
    message: 'Please slow down'
  },
  skip: (req) => req.path === '/health',
  handler: createRateLimitHandler('Request rate too high', 'Please slow down')
});

/**
 * GitHub API rate limiter
 */
const githubLimiter = rateLimit({
  windowMs: RATE_LIMITS.GITHUB.WINDOW_MS,
  max: RATE_LIMITS.GITHUB.MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'GitHub API rate limit exceeded',
    message: 'Please try again later'
  },
  handler: createRateLimitHandler('GitHub API rate limit exceeded', 'Please try again later')
});

/**
 * Abuse detection middleware
 * Blocks IPs with suspicious behavior patterns
 */
const abuseDetection = (req, res, next) => {
  const ip = req.ip;
  const data = abuseCache.get(ip);
  
  if (data && data.blocked) {
    const timeRemaining = Math.ceil((data.blockedUntil - Date.now()) / 1000 / 60);
    
    // Set CORS headers for blocked requests too
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, Accept');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      return res.status(200).end();
    }
    
    return next(ApiError.forbidden(
      'Access temporarily blocked', 
      `Try again in ${timeRemaining} minutes`
    ));
  }
  
  next();
};

module.exports = {
  standardLimiter,
  authLimiter,
  burstLimiter,
  githubLimiter,
  abuseDetection
}; 