/**
 * Error Handler Middleware
 * Centralized error handling for the application
 */

const { SERVER_LIMITS, IS_PROD } = require('../config/config');

/**
 * Custom API Error class
 */
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true; // Indicates if error is operational or programming
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details = null) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'Unauthorized', details = null) {
    return new ApiError(401, message, details);
  }

  static forbidden(message = 'Forbidden', details = null) {
    return new ApiError(403, message, details);
  }

  static notFound(message = 'Resource not found', details = null) {
    return new ApiError(404, message, details);
  }

  static tooManyRequests(message = 'Too many requests', details = null) {
    return new ApiError(429, message, details);
  }

  static internal(message = 'Internal server error', details = null) {
    return new ApiError(500, message, details);
  }
}

/**
 * Error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Check memory usage on errors
  const memoryUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
  if (memoryUsage > SERVER_LIMITS.MEMORY_THRESHOLD) {
    console.warn(`High memory usage: ${memoryUsage}MB`);
    global.gc && global.gc(); // Force garbage collection if available
  }

  // Log error
  console.error('Error:', err);

  // Default error status and message
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  let details = err.details || null;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    // Mongoose validation error
    statusCode = 400;
    message = 'Validation error';
    details = Object.values(err.errors).map(e => e.message);
  } else if (err.name === 'CastError') {
    // Mongoose cast error
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (err.name === 'MongoServerError' && err.code === 11000) {
    // Duplicate key error
    statusCode = 409;
    message = 'Duplicate entry';
    const field = Object.keys(err.keyValue)[0];
    details = `${field} already exists`;
  } else if (err.name === 'TokenExpiredError') {
    // JWT expired error
    statusCode = 401;
    message = 'Session expired';
    details = 'Please log in again';
  } else if (err.name === 'JsonWebTokenError') {
    // JWT invalid error
    statusCode = 401;
    message = 'Invalid token';
    details = 'Authentication failed';
  }

  // Ensure CORS headers are set for error responses
  // This is crucial for handling errors in cross-origin requests
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Send response
  res.status(statusCode).json({
    error: message,
    ...(details && !IS_PROD ? { details } : {}),
    ...(err.stack && !IS_PROD ? { stack: err.stack.split('\n') } : {})
  });
};

/**
 * Not found middleware
 */
const notFound = (req, res, next) => {
  const error = new ApiError(404, `Not found - ${req.originalUrl}`);
  next(error);
};

/**
 * Async handler to catch errors in async routes
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = {
  errorHandler,
  notFound,
  asyncHandler,
  ApiError
}; 