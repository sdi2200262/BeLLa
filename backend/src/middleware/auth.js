const jwt = require('jsonwebtoken');
const cacheService = require('../services/cacheService');

/**
 * Authentication middleware
 * Simplified to work with minimal User model and centralized caching
 */
const auth = async (req, res, next) => {
  try {
    // Get token from header or cookie
    const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if token is invalidated (from logout)
    const invalidated = cacheService.getUserData(`token:${token}`);
    if (invalidated && invalidated.invalid) {
      res.clearCookie('token');
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'Please log in again'
      });
    }

    // Check cache first
    const cachedUser = cacheService.getUserData(`auth:${token}`);
    if (cachedUser) {
      // Verify the token hasn't expired
      const now = Math.floor(Date.now() / 1000);
      if (cachedUser.exp && cachedUser.exp < now) {
        // Token has expired, clear it
        cacheService.clearUserCache(`auth:${token}`);
        res.clearCookie('token');
        return res.status(401).json({ 
          error: 'Session expired',
          message: 'Please log in again'
        });
      }
      
      req.user = cachedUser;
      return next();
    }

    // Verify token if not in cache
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Cache successful verifications
      cacheService.setUserData(`auth:${token}`, decoded, 300); // 5 minutes
      req.user = decoded;
      next();
    } catch (error) {
      // Clear token on verification failure
      res.clearCookie('token');
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Session expired',
          message: 'Please log in again'
        });
      }
      
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'Authentication failed'
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

// Export middleware
module.exports = auth; 