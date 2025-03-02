# BeLLa Backend

The previous backend implementation was uneccesarily complex and inefficient. This is a new implementation that is more efficient and easier to understand. It is also more secure and easier to maintain. Models are minimal, caching is centralized, and error handling / logging is thorough.

## Architecture Overview

The backend follows a clean, modular architecture using Node.js, Express, and MongoDB with the following components:

### Models

- **Project Model**: Stores minimal repository information
  - `repositoryUrl`: GitHub repository URL (unique identifier)
  - `githubUsername`: GitHub username of the user who added the project
  - `lastChecked`: Timestamp for caching purposes

- **User Model**: Stores only GitHub OAuth information
  - `githubId`: GitHub user ID (primary identifier)
  - `lastLogin`: Timestamp of the last login

---

We use Github's OAuth flow to authenticate users. This means that we don't need to store any user private data in our own database providing security and privacy.

---

### Services

- **Cache Service**: Centralized caching mechanism with three separate caches:
  - Repository data cache (30-minute TTL)
  - File content cache (1-hour TTL)
  - User data cache (24-hour TTL)

- **GitHub Service**: Handles all GitHub API interactions
  - Optimized with caching and rate limiting
  - Implements request queuing and retries
  - Processes and structures repository data

### Controllers

- **Auth Controller**: Manages user authentication via GitHub OAuth
  - Handles GitHub callback, logout, and user data retrieval
  - Centralized caching for tokens and user data using the cache service

- **Project Controller**: Manages project operations
  - Lists, adds, and deletes projects
  - Retrieves repository data, file trees, and file content
  - Centralized caching for all operations using the cache service

- **Contributors Controller**: Retrieves contributor information
  - Aggregates contributors across all BeLLa projects
  - Retrieves contributors for specific repositories
  - Centralized caching for all operations using the cache service

### Middleware

- **Auth Middleware**: Verifies JWT tokens for protected routes
  - Centralized caching for token verification using the cache service
  - Handles token invalidation during logout

- **Rate Limiter Middleware**: Prevents abuse and manages resource usage
  - Implements global, burst, auth, and GitHub-specific rate limits
  - Tracks suspicious activity and implements progressive blocking
  - Provides response caching for GET requests using the cache service

### Routes

- **Auth Routes**: Endpoints for authentication
  - `/api/auth/github`: GitHub OAuth callback
  - `/api/auth/logout`: User logout
  - `/api/auth/me`: Get current user data

- **Project Routes**: Endpoints for project management
  - `/api/projects`: List all projects and add new projects
  - `/api/projects/user`: Get user's projects
  - `/api/projects/data`: Get repository data
  - `/api/projects/tree`: Get file tree
  - `/api/projects/content`: Get file content
  - `/api/projects/:id`: Delete a project

- **Contributors Routes**: Endpoints for contributor information
  - `/api/contributors`: Get contributors for all projects or a specific repository

## Data Flow

### Authentication Flow

1. User authenticates via GitHub OAuth
2. Backend exchanges code for GitHub access token
3. User is created or updated in the database with minimal information
4. JWT token is generated and returned to the client
5. Token is verified on subsequent requests using auth middleware
    Only authenticated users can do actions like adding projects, making comments etc.

### Project Management Flow

1. User adds a project by providing a GitHub repository URL
2. Backend validates the URL and creates a project record
3. GitHub data is fetched and cached for the repository
4. User can view and delete their projects
5. Project data is enriched with GitHub information when displayed
6. Both authenticated users and guests can view projects in the Projects page, but only authenticated users can add projects.

### Data Retrieval Flow

1. Client requests repository data, file tree, or file content
2. Backend checks cache for the requested data
3. If cached, data is returned immediately
4. If not cached, data is fetched from GitHub API
5. Fetched data is processed, cached, and returned to the client

## Optimization Strategies

BeLLa will be hosted on Render.com. We will use the free tier plan and have to stay under its limits.
Therefore, we need to be mindful with the data we store and the requests we make.

### Minimal Data Storage

- Only essential information is stored in the database
- All repository data is fetched from GitHub API when needed
- No sensitive data or passwords are stored

### Efficient Caching

- Centralized caching service with different TTLs for different data types
- Repository data: 30 minutes
- File content: 1 hour
- User data: 24 hours
- Response caching for all GET requests

### Rate Limiting and Abuse Prevention

- Global rate limit: 300 requests per hour
- Burst rate limit: 10 requests per 5 seconds
- Auth rate limit: 5 login attempts per 15 minutes
- GitHub API rate limit: 50 requests per hour
- Progressive blocking for suspicious activity

### Performance Optimizations

- Compression for responses over 1KB
- Timeout settings to prevent long-running requests
- Memory usage monitoring and cleanup
- Payload size limits
- Efficient database queries with proper indexing

## Development

### Prerequisites

- Node.js 14+
- MongoDB 4.4+
- GitHub OAuth application credentials (see [GitHub Developer Settings](https://github.com/settings/developers))

### Environment Variables

```
# Server
PORT=3001
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/bella

# GitHub
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_TOKEN=your_github_personal_access_token

# JWT
JWT_SECRET=your_jwt_secret

# Frontend
FRONTEND_URL=http://localhost:3000
```

### Running the Backend Server

```bash
# Install dependencies
npm install

# Navigate to backend directory
cd backend

# Start development server
npm run dev
```


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.