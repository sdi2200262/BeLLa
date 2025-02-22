const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const githubAuth = async (req, res) => {
  const { code } = req.body;

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // Get user data from GitHub
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const githubUser = userResponse.data;

    // Find or create user in our database
    let user = await User.findOne({ githubId: githubUser.id });
    
    if (!user) {
      user = await User.create({
        githubId: githubUser.id,
        username: githubUser.login,
        email: githubUser.email,
        avatar: githubUser.avatar_url,
        name: githubUser.name,
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, githubId: user.githubId },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('GitHub auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

module.exports = {
  githubAuth,
}; 