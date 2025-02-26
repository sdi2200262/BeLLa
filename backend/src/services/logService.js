/**
 * Logging Service
 * Centralized logging with memory-efficient formatting
 */

const { IS_PROD } = require('../config/config');

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Current log level (less verbose in production)
const CURRENT_LEVEL = IS_PROD ? LOG_LEVELS.WARN : LOG_LEVELS.INFO;

// Limit the number of API logs per minute to reduce noise
const API_LOG_LIMIT = {
  count: 0,
  lastReset: Date.now(),
  maxPerMinute: 60,
  endpointCounts: {}
};

// Endpoints to exclude from logging or log less frequently
const LOW_PRIORITY_ENDPOINTS = [
  '/api/likes/counts',
  '/api/likes/',
  '/api/projects/user'
];

/**
 * Format log message
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} data - Additional data to log
 * @returns {string} Formatted log message
 */
function formatLog(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] ${level}:`;
  
  // Simple string message for better performance
  if (!data) {
    return `${prefix} ${message}`;
  }
  
  // Format error objects specially
  if (data instanceof Error) {
    return `${prefix} ${message} - ${data.message}\n${data.stack || ''}`;
  }
  
  // Format other data - limit the size of logged data
  try {
    // Truncate user agent to reduce log size
    if (data.userAgent && typeof data.userAgent === 'string' && data.userAgent.length > 30) {
      data.userAgent = data.userAgent.substring(0, 30) + "...";
    }
    
    // Truncate request body for likes/counts to reduce log size
    if (message.includes('/api/likes/counts') && data.body && data.body.projectIds) {
      const count = data.body.projectIds.length;
      data.body = { projectIds: `[${count} IDs]` };
    }
    
    const dataStr = JSON.stringify(data, null, IS_PROD ? 0 : 2);
    return `${prefix} ${message} ${dataStr}`;
  } catch (err) {
    return `${prefix} ${message} [Unserializable data]`;
  }
}

/**
 * Log to console with level check
 * @param {number} level - Log level
 * @param {string} levelName - Log level name
 * @param {string} message - Log message
 * @param {Object} data - Additional data to log
 */
function log(level, levelName, message, data = null) {
  if (level > CURRENT_LEVEL) return;
  
  // Check if this is an API request
  const isApiRequest = 
    (typeof message === 'string') && 
    (message.startsWith('GET /api/') || 
     message.startsWith('POST /api/') || 
     message.startsWith('PUT /api/') || 
     message.startsWith('DELETE /api/'));
  
  if (isApiRequest) {
    // Reset counter every minute
    const now = Date.now();
    if (now - API_LOG_LIMIT.lastReset > 60000) {
      API_LOG_LIMIT.count = 0;
      API_LOG_LIMIT.endpointCounts = {};
      API_LOG_LIMIT.lastReset = now;
    }
    
    // Extract the endpoint from the message
    const endpoint = message.split(' ')[1];
    
    // Check if this is a low priority endpoint
    const isLowPriority = LOW_PRIORITY_ENDPOINTS.some(e => endpoint.startsWith(e));
    
    // Increment endpoint-specific counter
    API_LOG_LIMIT.endpointCounts[endpoint] = (API_LOG_LIMIT.endpointCounts[endpoint] || 0) + 1;
    
    // Skip if we've exceeded the limit for this endpoint
    if (isLowPriority && API_LOG_LIMIT.endpointCounts[endpoint] > 3) {
      return; // Only log the first 3 requests for low priority endpoints
    }
    
    // Skip if we've exceeded the overall limit
    if (++API_LOG_LIMIT.count > API_LOG_LIMIT.maxPerMinute) {
      // Only log every 10th request when over the limit to show we're still alive
      if (API_LOG_LIMIT.count % 10 !== 0) {
        return;
      }
    }
  }
  
  const formattedMessage = formatLog(levelName, message, data);
  
  switch (level) {
    case LOG_LEVELS.ERROR:
      console.error(formattedMessage);
      break;
    case LOG_LEVELS.WARN:
      console.warn(formattedMessage);
      break;
    case LOG_LEVELS.INFO:
      console.info(formattedMessage);
      break;
    case LOG_LEVELS.DEBUG:
      console.debug(formattedMessage);
      break;
  }
}

/**
 * Logging service
 */
const logger = {
  /**
   * Log error message
   * @param {string} message - Error message
   * @param {Error|Object} error - Error object or data
   */
  error(message, error = null) {
    log(LOG_LEVELS.ERROR, 'ERROR', message, error);
  },
  
  /**
   * Log warning message
   * @param {string} message - Warning message
   * @param {Object} data - Additional data
   */
  warn(message, data = null) {
    log(LOG_LEVELS.WARN, 'WARN', message, data);
  },
  
  /**
   * Log info message
   * @param {string} message - Info message
   * @param {Object} data - Additional data
   */
  info(message, data = null) {
    log(LOG_LEVELS.INFO, 'INFO', message, data);
  },
  
  /**
   * Log debug message
   * @param {string} message - Debug message
   * @param {Object} data - Additional data
   */
  debug(message, data = null) {
    log(LOG_LEVELS.DEBUG, 'DEBUG', message, data);
  },
  
  /**
   * Create a logger for a specific module
   * @param {string} module - Module name
   * @returns {Object} Logger with module context
   */
  forModule(module) {
    return {
      error: (message, error = null) => 
        logger.error(`[${module}] ${message}`, error),
      warn: (message, data = null) => 
        logger.warn(`[${module}] ${message}`, data),
      info: (message, data = null) => 
        logger.info(`[${module}] ${message}`, data),
      debug: (message, data = null) => 
        logger.debug(`[${module}] ${message}`, data)
    };
  },
  
  /**
   * Log request information (for debugging)
   * @param {Object} req - Express request object
   */
  request(req) {
    if (CURRENT_LEVEL < LOG_LEVELS.DEBUG) return;
    
    logger.debug(`${req.method} ${req.originalUrl}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      params: req.params,
      query: req.query,
      body: req.body
    });
  }
};

module.exports = logger; 