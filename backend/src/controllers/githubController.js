const githubService = require('../services/githubService');

exports.getUserRepos = async (req, res) => {
  const { username } = req.params;
  try {
    const repo = await githubService.fetchUserRepos(username);
    res.json(repo);
  } catch (error) {
    console.error('Controller Error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// New controller methods
exports.getRepoContents = async (req, res) => {
  const { username, repo } = req.params;
  const { path = '' } = req.query;
  
  try {
    const contents = await githubService.fetchRepoContents(username, repo, path);
    res.json(contents);
  } catch (error) {
    console.error('Controller Error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.getFileContent = async (req, res) => {
  const { url } = req.query;
  
  try {
    const content = await githubService.fetchFileContent(url);
    res.json({ content });
  } catch (error) {
    console.error('Controller Error:', error.message);
    res.status(500).json({ error: error.message });
  }
};