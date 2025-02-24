const mongoose = require('mongoose');

/**
 * MongoDB Connection Options
 * Optimized for free tier and performance
 */
const MONGO_OPTIONS = {
  maxPoolSize: 5,           // Limit concurrent connections
  minPoolSize: 1,           // Keep at least one connection
  socketTimeoutMS: 45000,   // Slightly longer than server timeout
  connectTimeoutMS: 30000,  // Match server timeout
  serverSelectionTimeoutMS: 30000, // Match server timeout
  heartbeatFrequencyMS: 30000,
  family: 4,               // Force IPv4 (more stable)
  autoIndex: process.env.NODE_ENV !== 'production', // Disable in production
  maxConnecting: 2,        // Limit concurrent connection attempts
  writeConcern: {
    w: 1,                  // Basic write acknowledgment
    j: false              // Don't wait for journal
  },
  readPreference: 'primaryPreferred',
  retryWrites: true,
  compressors: ['zlib']   // Enable compression
};

/**
 * Memory monitoring
 */
const MEMORY_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
let memoryCheckInterval;

/**
 * Monitor memory usage and log warnings
 */
function startMemoryMonitoring() {
  memoryCheckInterval = setInterval(() => {
    const used = process.memoryUsage();
    const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
    const rssUsedMB = Math.round(used.rss / 1024 / 1024);
    
    if (heapUsedMB > 450 || rssUsedMB > 500) {
      console.warn(`High memory usage - Heap: ${heapUsedMB}MB, RSS: ${rssUsedMB}MB`);
    }
  }, MEMORY_CHECK_INTERVAL);
}

/**
 * Connect to MongoDB
 * With retry logic and connection monitoring
 */
async function connectDB() {
  let retries = 5;
  let connected = false;

  while (retries > 0 && !connected) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI, MONGO_OPTIONS);
      
      // Connection successful
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      connected = true;

      // Start memory monitoring
      startMemoryMonitoring();

      // Connection monitoring
      mongoose.connection.on('disconnected', () => {
        console.warn('MongoDB disconnected. Attempting to reconnect...');
        clearInterval(memoryCheckInterval);
      });

      mongoose.connection.on('reconnected', () => {
        console.log('MongoDB reconnected');
        startMemoryMonitoring();
      });

      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
        if (err.name === 'MongoServerSelectionError') {
          console.warn('Server selection timeout - check network or MongoDB status');
        }
      });

      // Graceful shutdown
      process.on('SIGINT', async () => {
        try {
          await mongoose.connection.close();
          console.log('MongoDB connection closed through app termination');
          process.exit(0);
        } catch (err) {
          console.error('Error during MongoDB shutdown:', err);
          process.exit(1);
        }
      });

    } catch (error) {
      console.error('MongoDB connection error:', error);
      retries -= 1;
      
      if (retries === 0) {
        console.error('Failed to connect to MongoDB after 5 attempts');
        process.exit(1);
      }
      
      // Exponential backoff
      const delay = Math.pow(2, 5 - retries) * 1000;
      console.log(`Retrying in ${delay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

module.exports = connectDB; 