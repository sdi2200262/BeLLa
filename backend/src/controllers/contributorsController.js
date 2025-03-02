const githubService = require('../services/githubService');
const cacheService = require('../services/cacheService');
const { bellaProjects } = require('../config/bella-projects');

/**
 * Resource Limits
 */
const LIMITS = {
  MAX_CONTRIBUTORS: 10  // Max contributors per response
};

/**
 * Contributors Controller
 * Simplified to work with centralized caching
 */
const contributorsController = {
  async getContributors(req, res) {
    try {
      const { url } = req.query;
      
      // If no URL provided, fetch contributors for all BeLLa projects
      if (!url) {
        const cacheKey = 'contributors:all';
        const cached = cacheService.getRepoData(cacheKey);
        if (cached) {
          return res.json({
            contributors: cached,
            cached: true
          });
        }

        // Fetch and aggregate contributors from all projects
        const contributorsMap = new Map();
        
        await Promise.all(
          bellaProjects.map(async (project) => {
            try {
              const { owner, repo } = githubService.parseRepoUrl(project.repositoryUrl);
              const contributors = await githubService.makeRequest(
                `/repos/${owner}/${repo}/contributors`,
                { params: { per_page: LIMITS.MAX_CONTRIBUTORS } }
              );

              contributors.forEach(c => {
                const key = c.login;
                if (contributorsMap.has(key)) {
                  contributorsMap.get(key).contributions += c.contributions;
                } else {
                  contributorsMap.set(key, {
                    username: c.login,
                    contributions: c.contributions,
                    avatar: c.avatar_url
                  });
                }
              });
            } catch (error) {
              console.error(`Error fetching contributors for ${project.repositoryUrl}:`, error);
            }
          })
        );

        const aggregatedContributors = Array.from(contributorsMap.values())
          .sort((a, b) => b.contributions - a.contributions)
          .slice(0, LIMITS.MAX_CONTRIBUTORS);

        // Cache the aggregated results
        cacheService.setRepoData(cacheKey, aggregatedContributors, 1800); // 30 minutes

        return res.json({
          contributors: aggregatedContributors,
          cached: false
        });
      }

      // Handle single repository contributors
      const cacheKey = `contributors:${url}`;
      const cached = cacheService.getRepoData(cacheKey);
      if (cached) {
        return res.json({
          contributors: cached,
          cached: true
        });
      }

      // Fetch and process contributors for single repository
      const { owner, repo } = githubService.parseRepoUrl(url);
      const contributors = await githubService.makeRequest(
        `/repos/${owner}/${repo}/contributors`,
        { params: { per_page: LIMITS.MAX_CONTRIBUTORS } }
      );

      const processedContributors = contributors.map(c => ({
        username: c.login,
        contributions: c.contributions,
        avatar: c.avatar_url
      }));

      // Cache the results
      cacheService.setRepoData(cacheKey, processedContributors, 1800); // 30 minutes

      res.json({
        contributors: processedContributors,
        cached: false
      });
    } catch (error) {
      console.error('Error fetching contributors:', error);
      res.status(500).json({ error: 'Failed to fetch contributors: ' + error.message });
    }
  }
};

module.exports = contributorsController; 