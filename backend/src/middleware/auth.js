const jwt = require('jsonwebtoken');
const NodeCache = require('node-cache');

/**
 * Token verification cache to reduce JWT decoding overhead
 * Optimized for Render free tier memory constraints
 */
const tokenCache = new NodeCache({
  stdTTL: 600,         // 10 minutes (increased from 5)
  checkperiod: 120,    // Check every 2 minutes (reduced frequency)
  maxKeys: 500,        // Reduced from 1000 to save memory
  useClones: false     // Don't clone objects (saves memory)
});

// Track cache stats for monitoring
let cacheHits = 0;
let cacheMisses = 0;

/**
 * Authentication middleware
 * Optimized for Render free tier with minimal memory usage
 */
const auth = async (req, res, next) => {
  try {
    // Get token from header or cookie
    const token = req.cookies?.token || req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check cache first (memory efficient)
    const cachedUser = tokenCache.get(token);
    if (cachedUser) {
      cacheHits++;
      
      // Log cache stats every 100 hits
      if (cacheHits % 100 === 0) {
        const hitRatio = cacheHits / (cacheHits + cacheMisses);
        console.log(`Auth cache stats - Hits: ${cacheHits}, Misses: ${cacheMisses}, Ratio: ${(hitRatio * 100).toFixed(2)}%`);
      }
      
      req.user = cachedUser;
      return next();
    }
    
    cacheMisses++;

    // Verify token if not in cache
    try {
      // Use non-async verification to reduce overhead
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ['HS256'], // Explicitly specify algorithm for security
        maxAge: '2h'          // Additional validation
      });
      
      // Only cache essential user data
      const minimalUserData = {
        id: decoded.id,
        username: decoded.username
      };
      
      // Cache successful verifications
      tokenCache.set(token, minimalUserData);
      req.user = minimalUserData;
      next();
    } catch (error) {
      // Clear token on verification failure
      res.clearCookie('token');
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Session expired'
        });
      }
      
      return res.status(401).json({ 
        error: 'Authentication failed'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    // Only flush cache on critical errors
    if (error.name === 'JsonWebTokenError') {
      tokenCache.flushAll();
      console.warn('Auth cache flushed due to JWT error');
    }
    
    res.status(500).json({ error: 'Authentication error' });
  }
};

// Export middleware
module.exports = auth; 