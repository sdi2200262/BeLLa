require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const { 
  PORT, 
  FRONTEND_URL, 
  SERVER_LIMITS, 
  IS_PROD,
  DB_CONFIG
} = require('./config/config');
const { 
  standardLimiter, 
  burstLimiter, 
  abuseDetection 
} = require('./middleware/rateLimiter');
const { 
  errorHandler, 
  notFound 
} = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const logger = require('./services/logService');

// Import routes
const projectRoutes = require('./routes/projectRoutes');
const contributorsRoutes = require('./routes/contributorsRoutes');
const authRoutes = require('./routes/authRoutes');
const likeRoutes = require('./routes/likeRoutes');

// Initialize app
const app = express();

/**
 * Connect to MongoDB
 * With retry logic and connection monitoring
 */
async function connectDB() {
  let retries = DB_CONFIG.RETRY_ATTEMPTS;
  let connected = false;

  while (retries > 0 && !connected) {
    try {
      const conn = await mongoose.connect(DB_CONFIG.URI, DB_CONFIG.OPTIONS);
      
      // Connection successful
      logger.info(`MongoDB Connected: ${conn.connection.host}`);
      connected = true;

      // Connection monitoring
      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected. Attempting to reconnect...');
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
      });

      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error:', err);
        if (err.name === 'MongoServerSelectionError') {
          logger.warn('Server selection timeout - check network or MongoDB status');
        }
      });

      // Graceful shutdown
      process.on('SIGINT', async () => {
        try {
          await mongoose.connection.close();
          logger.info('MongoDB connection closed through app termination');
          process.exit(0);
        } catch (err) {
          logger.error('Error during MongoDB shutdown:', err);
          process.exit(1);
        }
      });

    } catch (error) {
      logger.error('MongoDB connection error:', error);
      retries -= 1;
      
      if (retries === 0) {
        logger.error(`Failed to connect to MongoDB after ${DB_CONFIG.RETRY_ATTEMPTS} attempts`);
        process.exit(1);
      }
      
      // Exponential backoff
      const delay = Math.pow(2, DB_CONFIG.RETRY_ATTEMPTS - retries) * 1000;
      logger.info(`Retrying in ${delay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Connect to MongoDB with optimized settings
connectDB();

/**
 * Core Middleware - Optimized for Free Tier
 */

// Request logging
app.use(requestLogger);

// Server timeout settings
app.use((req, res, next) => {
  res.setTimeout(SERVER_LIMITS.SERVER_TIMEOUT, () => {
    res.status(408).json({ error: 'Request timeout' });
  });
  next();
});

// Security
app.use(helmet());

// Rate limiting and abuse prevention
app.use(abuseDetection);
app.use(burstLimiter);
app.use(standardLimiter);

// Compression
app.use(compression({
  level: 6,
  threshold: SERVER_LIMITS.COMPRESSION_THRESHOLD,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

// Body parsing with size limits
app.use(cookieParser());
app.use(express.json({ 
  limit: SERVER_LIMITS.PAYLOAD_SIZE,
  strict: true 
}));
app.use(express.urlencoded({ 
  extended: true,
  limit: SERVER_LIMITS.PAYLOAD_SIZE
}));

// CORS with security headers
app.use(cors({
  origin: IS_PROD ? FRONTEND_URL : 'http://localhost:3000',
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
app.use('/api/likes', likeRoutes);

// Health check with memory monitoring
app.get('/health', (req, res) => {
  const memoryUsage = process.memoryUsage();
  const usedMemoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
  
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    memory: {
      used: usedMemoryMB,
      limit: SERVER_LIMITS.MEMORY_THRESHOLD,
      percent: Math.round((usedMemoryMB / SERVER_LIMITS.MEMORY_THRESHOLD) * 100)
    },
    tier: 'free',
    limits: {
      requestsPerHour: SERVER_LIMITS.REQUESTS_PER_HOUR,
      payloadSize: SERVER_LIMITS.PAYLOAD_SIZE
    }
  });
});

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Shutting down gracefully...');
  app.close(() => process.exit(0));
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} (Free Tier)`);
}); 