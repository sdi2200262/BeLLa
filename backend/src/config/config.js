/**
 * Centralized Configuration
 * All application constants and configuration settings
 */

// Environment
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PROD = NODE_ENV === 'production';
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = IS_PROD ? process.env.FRONTEND_URL : 'http://localhost:3000';

// Database Configuration
const DB_CONFIG = {
  URI: process.env.MONGODB_URI,
  OPTIONS: {
    maxPoolSize: 5,           // Limit concurrent connections
    minPoolSize: 1,           // Keep at least one connection
    socketTimeoutMS: 45000,   // Slightly longer than server timeout
    connectTimeoutMS: 30000,  // Match server timeout
    serverSelectionTimeoutMS: 30000, // Match server timeout
    heartbeatFrequencyMS: 30000,
    family: 4,                // Force IPv4 (more stable)
    autoIndex: !IS_PROD,      // Disable in production
    maxConnecting: 2,         // Limit concurrent connection attempts
    writeConcern: {
      w: 1,                   // Basic write acknowledgment
      j: false                // Don't wait for journal
    },
    readPreference: 'primaryPreferred',
    retryWrites: true,
    compressors: ['zlib']     // Enable compression
  },
  RETRY_ATTEMPTS: 5
};

// Server Limits
const SERVER_LIMITS = {
  REQUESTS_PER_HOUR: 300,     // Free tier request limit
  PAYLOAD_SIZE: '250kb',      // Reduced payload size
  MEMORY_THRESHOLD: 450,      // 450MB memory limit (512MB total)
  COMPRESSION_THRESHOLD: 1024, // Compress responses over 1KB
  SERVER_TIMEOUT: 30000,      // 30 second timeout to match frontend
  MEMORY_CHECK_INTERVAL: 5 * 60 * 1000 // 5 minutes
};

// Cache Configuration
const CACHE_CONFIG = {
  TOKEN: {
    TTL: 7200,                // 2 hours
    MAX_KEYS: 1000            // Maximum cached tokens
  },
  GITHUB: {
    TTL: 300,                 // 5 minutes
    MAX_KEYS: 100             // Maximum cached GitHub responses
  },
  PROJECTS: {
    TTL: 300,                 // 5 minutes for project lists
    MAX_KEYS: 100,            // Limit total cached pages
    MAX_SIZE: 100000          // 100KB per cached page
  },
  PROJECT_DATA: {
    TTL: 1800,                // 30 minutes for project data
    MAX_KEYS: 200,            // Limit cached project details
    MAX_SIZE: 250000          // 250KB per project data
  },
  CLEANUP_INTERVAL: 10 * 60 * 1000 // Clean cache every 10 minutes
};

// Rate Limiting Configuration
const RATE_LIMITS = {
  GLOBAL: {
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
    MAX: IS_PROD ? 300 : 1000   // 300 requests per hour in production, 1000 in development
  },
  BURST: {
    WINDOW_MS: 5000,           // 5 seconds
    MAX: IS_PROD ? 10 : 50     // 10 requests per 5 seconds in production, 50 in development
  },
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX: IS_PROD ? 5 : 20      // 5 login attempts in production, 20 in development
  },
  GITHUB: {
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
    MAX: IS_PROD ? 50 : 200    // 50 GitHub API requests in production, 200 in development
  }
};

// Abuse Prevention Configuration
const ABUSE_CONFIG = {
  TTL: 3600,                   // 1 hour tracking
  WARNING_THRESHOLD: 3,        // Warnings before block
  BLOCK_DURATION: {
    FIRST: 30 * 60 * 1000,     // 30 minutes
    SECOND: 2 * 60 * 60 * 1000, // 2 hours
    THIRD: 24 * 60 * 60 * 1000  // 24 hours
  },
  CLEANUP_INTERVAL: 15 * 60 * 1000, // Clean old records every 15 minutes
  MAX_RECORDS: 10000           // Maximum number of tracked IPs
};

// Project Limits
const PROJECT_LIMITS = {
  PROJECTS_PER_USER: 5,        // Max active projects per user
  PAGE_SIZE: 9,                // Projects per page
  MAX_SEARCH_LENGTH: 50,       // Max search query length
  MAX_TREE_DEPTH: 5,           // Max file tree depth
  MAX_FILES: 500               // Max files in response
};

// Authentication Configuration
const AUTH_CONFIG = {
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRY: '2h',
  COOKIE_OPTIONS: {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'strict',
    maxAge: 2 * 60 * 60 * 1000 // 2 hours
  },
  GITHUB: {
    CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    API_TIMEOUT: 5000,
    MAX_RETRIES: 3
  }
};

// BeLLa Projects Configuration
const BELLA_PROJECTS = [
  {
    repositoryUrl: "https://github.com/sdi2200262/BeLLa",
    description: "BeLLa Project Management Platform"
  },
  {
    repositoryUrl: "https://github.com/sdi2200262/BeLLa-NERT",
    description: "A Web App development template using Node.js, Express, React, and TypeScript"
  }
];

module.exports = {
  NODE_ENV,
  IS_PROD,
  PORT,
  FRONTEND_URL,
  DB_CONFIG,
  SERVER_LIMITS,
  CACHE_CONFIG,
  RATE_LIMITS,
  ABUSE_CONFIG,
  PROJECT_LIMITS,
  AUTH_CONFIG,
  BELLA_PROJECTS
}; 