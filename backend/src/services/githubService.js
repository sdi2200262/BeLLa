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
      // Clean the URL first and remove query parameters
      const cleanUrl = url.trim().split('?')[0].replace(/\/$/, '');
      
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

  async getFileTree(url) {
    try {
      const { username, repoName } = this.parseGithubRepoUrl(url);
      
      // First get the default branch
      const repoResponse = await this.client.get(`/repos/${username}/${repoName}`);
      const defaultBranch = repoResponse.data.default_branch;

      // Get the tree with recursive option to get all files
      const treeResponse = await this.client.get(
        `/repos/${username}/${repoName}/git/trees/${defaultBranch}`,
        { params: { recursive: 1 } }
      );

      // Transform the flat tree into a hierarchical structure
      const root = { 
        id: 'root', 
        name: repoName, 
        type: 'tree',
        children: [] 
      };
      const map = { '': root };

      treeResponse.data.tree.forEach(item => {
        if (item.type !== 'blob' && item.type !== 'tree') return;

        const parts = item.path.split('/');
        let currentPath = '';

        parts.forEach((part, index) => {
          const parentPath = currentPath;
          currentPath = currentPath ? `${currentPath}/${part}` : part;

          if (!map[currentPath]) {
            const node = {
              id: currentPath,
              name: part,
              type: item.type,
              path: currentPath,
              children: [],
            };

            map[currentPath] = node;
            if (map[parentPath]) {
              map[parentPath].children.push(node);
            }
          }
        });
      });

      // Sort the tree: directories first, then files, both alphabetically
      const sortTree = (node) => {
        if (node.children) {
          node.children.sort((a, b) => {
            if (a.type === b.type) {
              return a.name.localeCompare(b.name);
            }
            return a.type === 'tree' ? -1 : 1;
          });
          node.children.forEach(sortTree);
        }
      };

      sortTree(root);
      return root;
    } catch (error) {
      console.error('Error fetching file tree:', error);
      throw new Error('Failed to fetch repository file tree');
    }
  }

  async getFileContent(url, path) {
    try {
      const { username, repoName } = this.parseGithubRepoUrl(url);
      
      // First get the default branch
      const repoResponse = await this.client.get(`/repos/${username}/${repoName}`);
      const defaultBranch = repoResponse.data.default_branch;

      // Get the file content
      const contentResponse = await this.client.get(
        `/repos/${username}/${repoName}/contents/${path}`,
        { params: { ref: defaultBranch } }
      );

      // GitHub returns base64 encoded content
      const content = Buffer.from(contentResponse.data.content, 'base64').toString();
      return { content };
    } catch (error) {
      console.error('Error fetching file content:', error);
      throw new Error('Failed to fetch file content');
    }
  }
}

module.exports = new GitHubService(); 