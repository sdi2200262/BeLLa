const githubService = require('../services/githubService');
const NodeCache = require('node-cache');
const { bellaProjects } = require('../config/bella-projects');

/**
 * Cache Configuration
 * Optimized for free tier memory constraints
 */
const CACHE_CONFIG = {
  TTL: 1800,         // 30 minutes
  MAX_KEYS: 100,     // Limit total cached repositories
  CHECK_PERIOD: 120  // Check for expired items every 2 minutes
};

/**
 * Resource Limits
 */
const LIMITS = {
  MAX_CONTRIBUTORS: 10,  // Max contributors per response
  CACHE_SIZE: 50000     // Max cache size per entry (bytes)
};

// Initialize cache with memory optimization
const contributorsCache = new NodeCache({
  stdTTL: CACHE_CONFIG.TTL,
  maxKeys: CACHE_CONFIG.MAX_KEYS,
  checkperiod: CACHE_CONFIG.CHECK_PERIOD,
  useClones: false // Save memory
});

/**
 * Contributors Controller
 * Optimized for free tier with caching and rate limiting
 */
const contributorsController = {
  async getContributors(req, res) {
    try {
      const { url } = req.query;
      
      // If no URL provided, fetch contributors for all BeLLa projects
      if (!url) {
        const cacheKey = 'contributors:all';
        const cached = contributorsCache.get(cacheKey);
        if (cached) {
          return res.json({
            contributors: cached,
            cached: true,
            cacheExpiry: contributorsCache.getTtl(cacheKey)
          });
        }

        // Fetch and aggregate contributors from all projects
        const contributorsMap = new Map();
        
        // Use Promise.allSettled to handle failures gracefully
        await Promise.allSettled(
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
              // Just log the error and continue with other projects
              console.error(`Error fetching contributors for ${project.repositoryUrl}:`, error);
            }
          })
        );

        const aggregatedContributors = Array.from(contributorsMap.values())
          .sort((a, b) => b.contributions - a.contributions)
          .slice(0, LIMITS.MAX_CONTRIBUTORS);

        // Cache the aggregated results if not empty
        if (aggregatedContributors.length > 0) {
          const responseSize = Buffer.byteLength(JSON.stringify(aggregatedContributors));
          if (responseSize <= LIMITS.CACHE_SIZE) {
            contributorsCache.set(cacheKey, aggregatedContributors);
          }
        }

        return res.json({
          contributors: aggregatedContributors,
          cached: false,
          limits: {
            maxContributors: LIMITS.MAX_CONTRIBUTORS,
            cacheTime: CACHE_CONFIG.TTL
          }
        });
      }

      // Handle single repository contributors
      const cacheKey = `contributors:${url}`;
      const cached = contributorsCache.get(cacheKey);
      if (cached) {
        return res.json({
          contributors: cached,
          cached: true,
          cacheExpiry: contributorsCache.getTtl(cacheKey)
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

      // Cache if response size is reasonable and not empty
      if (processedContributors.length > 0) {
        const responseSize = Buffer.byteLength(JSON.stringify(processedContributors));
        if (responseSize <= LIMITS.CACHE_SIZE) {
          contributorsCache.set(cacheKey, processedContributors);
        }
      }

      res.json({
        contributors: processedContributors,
        cached: false,
        limits: {
          maxContributors: LIMITS.MAX_CONTRIBUTORS,
          cacheTime: CACHE_CONFIG.TTL
        }
      });
    } catch (error) {
      console.error('Error fetching contributors:', error);
      
      // Clear cache on error
      if (req.query.url) {
        contributorsCache.del(`contributors:${req.query.url}`);
      } else {
        contributorsCache.del('contributors:all');
      }

      res.status(500).json({ error: 'Failed to fetch contributors' });
    }
  }
};

module.exports = contributorsController; 