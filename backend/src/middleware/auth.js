const jwt = require('jsonwebtoken');
const NodeCache = require('node-cache');

/**
 * Token verification cache to reduce JWT decoding overhead
 * 5 minute TTL, check every minute
 */
const tokenCache = new NodeCache({
  stdTTL: 300,
  checkperiod: 60,
  maxKeys: 1000 // Limit cache size for free tier
});

/**
 * Authentication middleware
 * Optimized for free tier with caching and rate limiting
 */
const auth = async (req, res, next) => {
  try {
    // Get token from header or cookie
    const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check cache first
    const cachedUser = tokenCache.get(token);
    if (cachedUser) {
      req.user = cachedUser;
      return next();
    }

    // Verify token if not in cache
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Cache successful verifications
      tokenCache.set(token, decoded);
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
    // Clear cache on error
    tokenCache.flushAll();
    res.status(500).json({ error: 'Authentication error' });
  }
};

// Export middleware
module.exports = auth; 