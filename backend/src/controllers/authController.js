const jwt = require('jsonwebtoken');
const User = require('../models/User');
const cacheService = require('../services/cacheService');

/**
 * Auth Controller
 * Handles user authentication via GitHub OAuth
 * Simplified to work with minimal User model
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
      const cachedData = cacheService.getUserData(`oauth:${code}`);
      if (cachedData) {
        return res.json(cachedData);
      }

      // Exchange code for GitHub data
      const githubData = await exchangeCodeForGitHubData(code);
      if (!githubData) {
        return res.status(400).json({ error: 'Failed to authenticate with GitHub' });
      }

      // Find or create user with just githubId
      let user = await User.findOne({ githubId: githubData.id });
      if (!user) {
        user = await User.create({
          githubId: githubData.id
        });
      } else {
        // Update last login
        await user.updateLastLogin();
      }

      // Generate token with minimal payload including GitHub username
      const token = jwt.sign(
        { 
          id: user._id, 
          githubId: user.githubId,
          githubUsername: githubData.login // Include GitHub username in token
        },
        process.env.JWT_SECRET,
        { expiresIn: '2h' }
      );

      // Prepare response data with GitHub profile info
      const responseData = {
        user: {
          id: user._id,
          githubId: user.githubId,
          // Include GitHub profile data from the API response
          username: githubData.login,
          avatar: githubData.avatar_url,
          name: githubData.name
        },
        token
      };

      // Cache successful response
      cacheService.setUserData(`oauth:${code}`, responseData, 300); // 5 minutes TTL for OAuth codes

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
        // Invalidate token in cache
        cacheService.setUserData(`token:${token}`, { invalid: true }, 7200); // 2 hours (token expiry)
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
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get GitHub profile data from cache or API
      const githubData = await getGitHubUserData(user.githubId);

      // Return user data combined with GitHub profile
      res.json({
        id: user._id,
        githubId: user.githubId,
        lastLogin: user.lastLogin,
        // Include GitHub profile data
        username: githubData?.login || req.user.githubUsername,
        name: githubData?.name,
        avatar: githubData?.avatar_url
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

      const userData = await userResponse.json();
      
      // Cache the access token with the user's GitHub ID
      if (userData && userData.id) {
        cacheService.setUserData(`github_token:${userData.id}`, {
          access_token: tokenData.access_token,
          expires_at: Date.now() + (tokenData.expires_in || 28800) * 1000 // Default 8 hours
        }, tokenData.expires_in || 28800);
      }
      
      return userData;
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
 * Get GitHub user data from cache or API
 */
async function getGitHubUserData(githubId) {
  // Check cache first
  const cachedUser = cacheService.getUserData(`github_user:${githubId}`);
  if (cachedUser) {
    return cachedUser;
  }
  
  // Get access token from cache
  const tokenData = cacheService.getUserData(`github_token:${githubId}`);
  if (!tokenData || !tokenData.access_token) {
    return null;
  }
  
  try {
    // Fetch user data from GitHub API
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    const userData = await response.json();
    
    // Cache user data
    cacheService.setUserData(`github_user:${githubId}`, userData, 3600); // 1 hour
    
    return userData;
  } catch (error) {
    console.error('Error fetching GitHub user data:', error);
    return null;
  }
}

module.exports = authController; 