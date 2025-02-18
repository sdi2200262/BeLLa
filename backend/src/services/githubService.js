const axios = require('axios');

const githubToken = process.env.GITHUB_TOKEN;

const config = {
  headers: {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  }
};

if (githubToken) {
  config.headers['Authorization'] = `Bearer ${githubToken}`;
}

exports.fetchUserRepos = async (username) => {
  const url = `https://api.github.com/repos/${username}/BeLLa-NERT`;
  
  try {
    const response = await axios.get(url, config);
    return response.data;
  } catch (error) {
    console.error('GitHub API Error:', error.response?.data || error.message);
    throw new Error('Unable to fetch repository from Github.');
  }
};

// New function to fetch repository contents
exports.fetchRepoContents = async (username, repo, path = '') => {
  const url = `https://api.github.com/repos/${username}/${repo}/contents/${path}`;
  
  try {
    const response = await axios.get(url, config);
    const contents = await processContents(response.data);
    return contents;
  } catch (error) {
    console.error('GitHub API Error:', error.response?.data || error.message);
    throw new Error('Unable to fetch repository contents from Github.');
  }
};

// New function to fetch file content
exports.fetchFileContent = async (url) => {
  try {
    const response = await axios.get(url, config);
    const content = Buffer.from(response.data.content, 'base64').toString();
    return content;
  } catch (error) {
    console.error('GitHub API Error:', error.response?.data || error.message);
    throw new Error('Unable to fetch file content from Github.');
  }
};

// Helper function to process contents recursively
async function processContents(items) {
  if (!Array.isArray(items)) return [];

  const processedItems = await Promise.all(items.map(async (item) => {
    const node = {
      id: item.path,
      name: item.name,
      type: item.type,
      url: item.download_url
    };

    if (item.type === 'dir') {
      const response = await axios.get(item.url, config);
      node.children = await processContents(response.data);
    }

    return node;
  }));

  return processedItems;
}