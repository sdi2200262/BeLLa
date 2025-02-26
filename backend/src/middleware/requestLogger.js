/**
 * Request Logger Middleware
 * Streamlined logging for HTTP requests
 */

const logger = require('../services/logService');

/**
 * Paths that shouldn't be logged to reduce noise
 */
const IGNORED_PATHS = [
  '/health',
  '/api/health',
  '/favicon.ico'
];

/**
 * Request logger middleware with configurable verbosity
 * Only logs once per request, when it completes
 */
const requestLogger = (req, res, next) => {
  // Skip logging for ignored paths or if in production with non-error log level
  if (
    IGNORED_PATHS.includes(req.path) || 
    (process.env.NODE_ENV === 'production' && process.env.LOG_LEVEL !== 'debug')
  ) {
    return next();
  }
  
  // Record request start time
  const start = Date.now();
  
  // Only log request body in debug mode for non-GET requests
  if (process.env.LOG_LEVEL === 'debug' && req.method !== 'GET' && req.body) {
    logger.debug('Request body', {
      body: req.body
    });
  }
  
  // Capture response data
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    // Calculate response time
    const responseTime = Date.now() - start;
    
    // Skip logging for OPTIONS requests unless in debug mode
    if (req.method === 'OPTIONS' && process.env.LOG_LEVEL !== 'debug') {
      return originalEnd.call(this, chunk, encoding);
    }
    
    // Skip logging for extremely fast responses (likely cached or duplicate)
    if (responseTime < 5 && req.method === 'GET') {
      return originalEnd.call(this, chunk, encoding);
    }
    
    // Compact log with essential info
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} (${responseTime}ms)`);
    
    // Call original end method
    return originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

module.exports = requestLogger; 