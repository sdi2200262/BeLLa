/**
 * Request Logger Middleware
 * Logs incoming requests and response times
 */

const logger = require('../services/logService');

/**
 * Request logger middleware
 * Logs request details and response time
 */
const requestLogger = (req, res, next) => {
  // Skip logging for health checks in production
  if (process.env.NODE_ENV === 'production' && req.path === '/health') {
    return next();
  }
  
  // Record request start time
  const start = Date.now();
  
  // Log basic request info
  logger.info(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')?.substring(0, 50)
  });
  
  // Log request body in debug mode
  if (req.method !== 'GET' && req.body) {
    logger.debug('Request body', {
      body: req.body
    });
  }
  
  // Capture response data
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    // Calculate response time
    const responseTime = Date.now() - start;
    
    // Log response info
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode}`, {
      responseTime: `${responseTime}ms`
    });
    
    // Call original end method
    return originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

module.exports = requestLogger; 