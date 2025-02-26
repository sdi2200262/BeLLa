const githubService = require('../services/githubService');
const cacheService = require('../services/cacheService');
const logger = require('../services/logService');
const { CACHE_CONFIG, SERVER_LIMITS, BELLA_PROJECTS } = require('../config/config');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Resource Limits
 */
const LIMITS = {
  MAX_CONTRIBUTORS: 10,  // Max contributors per response
  CACHE_SIZE: 50000     // Max cache size per entry (bytes)
};

/**
 * Contributors Controller
 * Optimized for free tier with caching and rate limiting
 */
const contributorsController = {
  getContributors: asyncHandler(async (req, res) => {
    const { url } = req.query;
    
    // If no URL provided, fetch contributors for all BeLLa projects
    if (!url) {
      const cacheKey = 'contributors:all';
      const cached = cacheService.get('projectData', cacheKey);
      if (cached) {
        return res.json({
          contributors: cached,
          cached: true,
          cacheExpiry: cacheService.getTtl('projectData', cacheKey)
        });
      }

      // Fetch and aggregate contributors from all projects
      const contributorsMap = new Map();
      
      await Promise.all(
        BELLA_PROJECTS.map(async (project) => {
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
            logger.error(`Error fetching contributors for ${project.repositoryUrl}:`, error);
          }
        })
      );

      const aggregatedContributors = Array.from(contributorsMap.values())
        .sort((a, b) => b.contributions - a.contributions)
        .slice(0, LIMITS.MAX_CONTRIBUTORS);

      // Cache the aggregated results
      const responseSize = Buffer.byteLength(JSON.stringify(aggregatedContributors));
      if (responseSize <= LIMITS.CACHE_SIZE) {
        cacheService.set('projectData', cacheKey, aggregatedContributors);
      }

      return res.json({
        contributors: aggregatedContributors,
        cached: false,
        limits: {
          maxContributors: LIMITS.MAX_CONTRIBUTORS,
          cacheTime: CACHE_CONFIG.PROJECT_DATA.TTL
        }
      });
    }

    // Handle single repository contributors
    const cacheKey = `contributors:${url}`;
    const cached = cacheService.get('projectData', cacheKey);
    if (cached) {
      return res.json({
        contributors: cached,
        cached: true,
        cacheExpiry: cacheService.getTtl('projectData', cacheKey)
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

    // Cache if response size is reasonable
    const responseSize = Buffer.byteLength(JSON.stringify(processedContributors));
    if (responseSize <= LIMITS.CACHE_SIZE) {
      cacheService.set('projectData', cacheKey, processedContributors);
    }

    res.json({
      contributors: processedContributors,
      cached: false,
      limits: {
        maxContributors: LIMITS.MAX_CONTRIBUTORS,
        cacheTime: CACHE_CONFIG.PROJECT_DATA.TTL
      }
    });
  })
};

module.exports = contributorsController; 