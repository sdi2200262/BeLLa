const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const cacheService = require('../services/cacheService');
const { AUTH_CONFIG } = require('../config/config');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

/**
 * Auth Controller
 * Handles user authentication and session management
 * Optimized for free tier with caching and memory management
 */
const authController = {
  // GitHub OAuth callback
  githubCallback: asyncHandler(async (req, res) => {
    const { code } = req.body;
    if (!code) {
      throw ApiError.badRequest('Authorization code required');
    }

    // Check cache for GitHub data
    const cachedData = cacheService.get('github', code);
    if (cachedData) {
      return res.json(cachedData);
    }

    // Exchange code for GitHub data
    const githubData = await exchangeCodeForGitHubData(code);
    if (!githubData) {
      throw ApiError.badRequest('Failed to authenticate with GitHub');
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
      { id: user._id, username: user.username, role: user.role },
      AUTH_CONFIG.JWT_SECRET,
      { expiresIn: AUTH_CONFIG.JWT_EXPIRY }
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
    cacheService.set('github', code, responseData);

    // Set cookie with security options
    res.cookie('token', token, AUTH_CONFIG.COOKIE_OPTIONS);

    res.json(responseData);
  }),

  // Logout
  logout: asyncHandler(async (req, res) => {
    const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      // Remove from cache
      cacheService.del('token', token);
    }
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
  }),

  // Get current user
  getCurrentUser: asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id)
      .select('-password')
      .lean()
      .exec();

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Return minimal user data
    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    });
  })
};

/**
 * Helper to exchange GitHub code for user data
 * Optimized with retries and timeout
 */
async function exchangeCodeForGitHubData(code) {
  for (let attempt = 1; attempt <= AUTH_CONFIG.GITHUB.MAX_RETRIES; attempt++) {
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
            client_id: AUTH_CONFIG.GITHUB.CLIENT_ID,
            client_secret: AUTH_CONFIG.GITHUB.CLIENT_SECRET,
            code
          })
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), AUTH_CONFIG.GITHUB.API_TIMEOUT)
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
          setTimeout(() => reject(new Error('Request timeout')), AUTH_CONFIG.GITHUB.API_TIMEOUT)
        )
      ]);

      return userResponse.json();
    } catch (error) {
      console.error(`GitHub API attempt ${attempt} failed:`, error);
      if (attempt === AUTH_CONFIG.GITHUB.MAX_RETRIES) return null;
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