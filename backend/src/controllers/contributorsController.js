const axios = require('axios');
const { bellaProjects } = require('../config/bella-projects');

const getUniqueContributors = async (req, res) => {
  try {
    const uniqueContributors = new Map();

    // Fetch contributors from each project
    const contributorsPromises = bellaProjects.map(async (project) => {
      try {
        const repoPath = project.repositoryUrl.replace('https://github.com/', '');
        const response = await axios.get(`https://api.github.com/repos/${repoPath}/contributors`, {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            ...(process.env.GITHUB_TOKEN && { 'Authorization': `token ${process.env.GITHUB_TOKEN}` })
          }
        });

        response.data.forEach(contributor => {
          if (!uniqueContributors.has(contributor.login)) {
            uniqueContributors.set(contributor.login, {
              login: contributor.login,
              avatar_url: contributor.avatar_url,
              html_url: contributor.html_url,
              contributions: contributor.contributions
            });
          } else {
            // Sum up contributions if contributor exists in multiple projects
            const existing = uniqueContributors.get(contributor.login);
            existing.contributions += contributor.contributions;
            uniqueContributors.set(contributor.login, existing);
          }
        });
      } catch (error) {
        console.error(`Error fetching contributors for ${project.repositoryUrl}:`, error.message);
      }
    });

    await Promise.all(contributorsPromises);

    // Convert Map to Array and sort by contributions
    const sortedContributors = Array.from(uniqueContributors.values())
      .sort((a, b) => b.contributions - a.contributions);

    res.json(sortedContributors);
  } catch (error) {
    console.error('Error in getUniqueContributors:', error);
    res.status(500).json({ error: 'Failed to fetch contributors' });
  }
};

module.exports = {
  getUniqueContributors
}; 