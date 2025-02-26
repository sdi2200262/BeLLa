/**
 * Authentication Middleware
 * Handles token verification and user authentication
 */

const jwt = require('jsonwebtoken');
const cacheService = require('../services/cacheService');
const { AUTH_CONFIG } = require('../config/config');
const { ApiError } = require('./errorHandler');

/**
 * Authentication middleware
 * Verifies JWT tokens from cookies or Authorization header
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header or cookie
    const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    // Check cache first
    const cachedUser = cacheService.get('token', token);
    if (cachedUser) {
      req.user = cachedUser;
      return next();
    }

    // Verify token if not in cache
    try {
      const decoded = jwt.verify(token, AUTH_CONFIG.JWT_SECRET);
      
      // Cache successful verifications
      cacheService.set('token', token, decoded);
      req.user = decoded;
      next();
    } catch (error) {
      // Clear token on verification failure
      res.clearCookie('token');
      
      if (error.name === 'TokenExpiredError') {
        return next(ApiError.unauthorized('Session expired', 'Please log in again'));
      }
      
      return next(ApiError.unauthorized('Invalid token', 'Authentication failed'));
    }
  } catch (error) {
    // Clear cache on error
    cacheService.flush('token');
    next(ApiError.internal('Authentication error'));
  }
};

/**
 * Role-based authorization middleware
 * @param {string[]} roles - Array of allowed roles
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Insufficient permissions'));
    }

    next();
  };
};

// Export both names for backward compatibility
module.exports = {
  auth: authenticate, // For backward compatibility
  authenticate,
  authorize
}; 