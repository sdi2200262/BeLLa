const jwt = require('jsonwebtoken');
const User = require('../models/User');
const NodeCache = require('node-cache');
const bcrypt = require('bcrypt');

/**
 * Cache Configuration
 */
const CACHE_CONFIG = {
  TOKEN: {
    TTL: 7200,        // 2 hours
    MAX_KEYS: 1000    // Maximum cached tokens
  },
  GITHUB: {
    TTL: 300,         // 5 minutes
    MAX_KEYS: 100     // Maximum cached GitHub responses
  }
};

/**
 * Initialize caches
 */
const tokenCache = new NodeCache({
  stdTTL: CACHE_CONFIG.TOKEN.TTL,
  maxKeys: CACHE_CONFIG.TOKEN.MAX_KEYS,
  useClones: false
});

const githubCache = new NodeCache({
  stdTTL: CACHE_CONFIG.GITHUB.TTL,
  maxKeys: CACHE_CONFIG.GITHUB.MAX_KEYS,
  useClones: false
});

/**
 * Auth Controller
 * Handles user authentication and session management
 * Optimized for free tier with caching and memory management
 */
const authController = {
  // GitHub OAuth callback
  async githubCallback(req, res) {
    try {
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ error: 'Authorization code required' });
      }

      // Check cache for GitHub data
      const cachedData = githubCache.get(code);
      if (cachedData) {
        return res.json(cachedData);
      }

      // Exchange code for GitHub data
      const githubData = await exchangeCodeForGitHubData(code);
      if (!githubData) {
        return res.status(400).json({ error: 'Failed to authenticate with GitHub' });
      }

      // Find or create user
      let user = await User.findOne({ githubId: githubData.id });
      if (!user) {
        user = await User.create({
          githubId: githubData.id,
          username: githubData.login,
          email: githubData.email || `${githubData.login}@users.noreply.github.com`,
          password: await generateRandomPassword() // Required by schema
        });
      }

      // Generate token with minimal payload
      const token = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '2h' }
      );

      // Update last login
      await user.updateLastLogin();

      // Prepare response data
      const responseData = {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        token
      };

      // Cache successful response
      githubCache.set(code, responseData);

      // Set cookie with security options
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 2 * 60 * 60 * 1000 // 2 hours
      });

      res.json(responseData);
    } catch (error) {
      console.error('Auth error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  },

  // Logout
  async logout(req, res) {
    try {
      const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');
      if (token) {
        // Remove from cache
        tokenCache.del(token);
      }
      res.clearCookie('token');
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  },

  // Get current user
  async getCurrentUser(req, res) {
    try {
      const user = await User.findById(req.user.id)
        .select('-password')
        .lean()
        .exec();

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Return minimal user data
      res.json({
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to get user data' });
    }
  }
};

/**
 * Helper to exchange GitHub code for user data
 * Optimized with retries and timeout
 */
async function exchangeCodeForGitHubData(code) {
  const MAX_RETRIES = 3;
  const TIMEOUT = 5000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Get access token with timeout
      const tokenResponse = await Promise.race([
        fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code
          })
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), TIMEOUT)
        )
      ]);

      const tokenData = await tokenResponse.json();
      if (!tokenData.access_token) {
        throw new Error('No access token in response');
      }

      // Get user data with timeout
      const userResponse = await Promise.race([
        fetch('https://api.github.com/user', {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Accept': 'application/json'
          }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), TIMEOUT)
        )
      ]);

      return userResponse.json();
    } catch (error) {
      console.error(`GitHub API attempt ${attempt} failed:`, error);
      if (attempt === MAX_RETRIES) return null;
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  return null;
}

/**
 * Generate random password for GitHub users
 */
async function generateRandomPassword() {
  const length = 32;
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return await bcrypt.hash(password, 10);
}

module.exports = authController; 