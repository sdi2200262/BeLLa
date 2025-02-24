require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');

// Import routes
const projectRoutes = require('./routes/projectRoutes');
const contributorsRoutes = require('./routes/contributorsRoutes');
const authRoutes = require('./routes/authRoutes');

// Initialize app
const app = express();
const PORT = process.env.PORT || 3001;

/**
 * Free Tier Optimizations
 */
const LIMITS = {
  REQUESTS_PER_HOUR: 300,    // Free tier request limit
  PAYLOAD_SIZE: '250kb',     // Reduced payload size
  MEMORY_THRESHOLD: 450,     // 450MB memory limit (512MB total)
  COMPRESSION_THRESHOLD: 1024, // Compress responses over 1KB
  SERVER_TIMEOUT: 30000      // 30 second timeout to match frontend
};

// Connect to MongoDB with optimized settings
connectDB();

/**
 * Core Middleware - Optimized for Free Tier
 */

// Server timeout settings
app.use((req, res, next) => {
  res.setTimeout(LIMITS.SERVER_TIMEOUT, () => {
    res.status(408).json({ error: 'Request timeout' });
  });
  next();
});

// Security
app.use(helmet());

// Rate limiting
app.use(rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: LIMITS.REQUESTS_PER_HOUR,
  message: {
    error: 'Too many requests',
    message: 'Please try again in an hour'
  },
  skip: (req) => req.path === '/health'
}));

// Compression
app.use(compression({
  level: 6,
  threshold: LIMITS.COMPRESSION_THRESHOLD,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

// Body parsing with size limits
app.use(cookieParser());
app.use(express.json({ 
  limit: LIMITS.PAYLOAD_SIZE,
  strict: true 
}));
app.use(express.urlencoded({ 
  extended: true,
  limit: LIMITS.PAYLOAD_SIZE
}));

// CORS with security headers
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
  exposedHeaders: ['Content-Length', 'X-Requested-With'],
  maxAge: 3600 // Cache preflight for 1 hour
}));

/**
 * Routes
 */
app.use('/api/projects', projectRoutes);
app.use('/api/contributors', contributorsRoutes);
app.use('/api/auth', authRoutes);

// Health check with memory monitoring
app.get('/health', (req, res) => {
  const memoryUsage = process.memoryUsage();
  const usedMemoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
  
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    memory: {
      used: usedMemoryMB,
      limit: LIMITS.MEMORY_THRESHOLD,
      percent: Math.round((usedMemoryMB / LIMITS.MEMORY_THRESHOLD) * 100)
    },
    tier: 'free',
    limits: {
      requestsPerHour: LIMITS.REQUESTS_PER_HOUR,
      payloadSize: LIMITS.PAYLOAD_SIZE
    }
  });
});

// Error handler with memory cleanup
app.use((err, req, res, next) => {
  // Check memory usage on errors
  const memoryUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
  if (memoryUsage > LIMITS.MEMORY_THRESHOLD) {
    console.warn(`High memory usage: ${memoryUsage}MB`);
    global.gc && global.gc(); // Force garbage collection if available
  }

  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'An error occurred' 
      : err.message
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  app.close(() => process.exit(0));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} (Free Tier)`);
}); 