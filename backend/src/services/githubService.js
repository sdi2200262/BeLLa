const axios = require('axios');

class GitHubService {
  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
  }

  parseGithubRepoUrl(url) {
    try {
      // Clean the URL first
      const cleanUrl = url.trim().replace(/\/$/, '');
      
      // Check if it's an organization URL (has no repository part)
      const orgMatch = cleanUrl.match(/^https?:\/\/(?:www\.)?github\.com\/([^\/]+)\/?$/);
      if (orgMatch) {
        throw new Error('Please provide a specific repository URL, not an organization URL. For example: https://github.com/ollama/ollama');
      }

      // Handle both HTTPS and SSH URLs
      let match;
      if (cleanUrl.startsWith('git@')) {
        // SSH URL format: git@github.com:username/repo.git
        match = cleanUrl.match(/git@github\.com:([^\/]+)\/([^\.]+)(\.git)?/);
      } else {
        // HTTPS URL format: https://github.com/username/repo
        match = cleanUrl.match(/https?:\/\/(?:www\.)?github\.com\/([^\/]+)\/([^\/\s]+)/);
      }

      if (!match) {
        throw new Error('Invalid GitHub repository URL. Please provide a URL in the format: https://github.com/username/repository');
      }

      const [, username, repoName] = match;
      // Don't modify the repository name, just remove .git if present
      return {
        username,
        repoName: repoName.replace(/\.git$/, '')
      };
    } catch (error) {
      console.error('URL parsing error:', error);
      throw error; // Propagate the detailed error message
    }
  }

  async getRepositoryData(url) {
    console.log('Fetching data for URL:', url);
    const parsed = this.parseGithubRepoUrl(url);
    if (!parsed) {
      throw new Error('Invalid GitHub repository URL');
    }

    const { username, repoName } = parsed;
    console.log('Parsed repository details:', { username, repoName });
    
    try {
      // First verify the repository exists and is accessible
      const repoResponse = await this.client.get(`/repos/${username}/${repoName}`);
      if (!repoResponse.data) {
        throw new Error('Repository not found');
      }

      // Then fetch languages
      const languagesResponse = await this.client.get(`/repos/${username}/${repoName}/languages`);

      // Get commit count
      const commitsResponse = await this.client.get(
        `/repos/${username}/${repoName}/commits`,
        { 
          params: { 
            per_page: 1,
            sha: repoResponse.data.default_branch
          }
        }
      );

      // Extract commit count from the Link header
      let commitCount = 0;
      const linkHeader = commitsResponse.headers['link'];
      if (linkHeader) {
        const matches = linkHeader.match(/page=(\d+)>; rel="last"/);
        commitCount = matches ? parseInt(matches[1]) : 0;
      }

      return {
        ...repoResponse.data,
        languages: languagesResponse.data,
        commitCount
      };
    } catch (error) {
      console.error('GitHub API Error:', {
        message: error.response?.data?.message || error.message,
        status: error.response?.status,
        url: error.config?.url,
        // Don't log headers to avoid exposing tokens
        error: error.toString()
      });
      throw new Error(error.response?.data?.message || 'Failed to fetch repository data');
    }
  }
}

module.exports = new GitHubService(); 