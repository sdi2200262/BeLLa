const mongoose = require('mongoose');

/**
 * MongoDB Connection Options
 * Optimized for free tier and minimal resource usage
 */
const MONGO_OPTIONS = {
  maxPoolSize: 3,           // Reduced from 5 to save resources
  minPoolSize: 1,           // Keep at least one connection
  socketTimeoutMS: 30000,   // Reduced timeout to save resources
  connectTimeoutMS: 20000,  // Reduced timeout to save resources
  serverSelectionTimeoutMS: 20000, // Reduced timeout to save resources
  heartbeatFrequencyMS: 60000, // Increased to reduce overhead
  family: 4,                // Force IPv4 (more stable)
  autoIndex: false,         // Always disable autoIndex for performance
  maxConnecting: 1,         // Reduced from 2 to save resources
  writeConcern: {
    w: 1,                   // Basic write acknowledgment
    j: false                // Don't wait for journal
  },
  readPreference: 'primaryPreferred',
  retryWrites: true,
  compressors: ['zlib'],    // Enable compression
  bufferCommands: false     // Fail fast instead of buffering commands
};

/**
 * Memory monitoring with adaptive thresholds
 */
const MEMORY_CHECK_INTERVAL = 10 * 60 * 1000; // 10 minutes (increased from 5)
const MEMORY_WARNING_THRESHOLD = {
  HEAP: 400,  // MB - reduced from 450
  RSS: 450    // MB - reduced from 500
};
let memoryCheckInterval;

/**
 * Monitor memory usage and log warnings
 * With garbage collection suggestion
 */
function startMemoryMonitoring() {
  memoryCheckInterval = setInterval(() => {
    const used = process.memoryUsage();
    const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
    const rssUsedMB = Math.round(used.rss / 1024 / 1024);
    
    if (heapUsedMB > MEMORY_WARNING_THRESHOLD.HEAP || rssUsedMB > MEMORY_WARNING_THRESHOLD.RSS) {
      console.warn(`High memory usage - Heap: ${heapUsedMB}MB, RSS: ${rssUsedMB}MB`);
      
      // Suggest garbage collection if memory is critically high
      if (heapUsedMB > MEMORY_WARNING_THRESHOLD.HEAP * 1.2 || rssUsedMB > MEMORY_WARNING_THRESHOLD.RSS * 1.2) {
        console.warn('Memory usage critical - suggesting garbage collection');
        if (global.gc) {
          global.gc();
          console.log('Manual garbage collection triggered');
        }
      }
    }
  }, MEMORY_CHECK_INTERVAL);
}

/**
 * Connect to MongoDB
 * With retry logic, connection monitoring, and performance optimizations
 */
async function connectDB() {
  let retries = 3; // Reduced from 5 to fail faster
  let connected = false;

  // Set mongoose options globally
  mongoose.set('strictQuery', true); // Strict mode for better error detection
  mongoose.set('debug', process.env.NODE_ENV === 'development'); // Only log queries in development

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

      // Performance monitoring
      if (process.env.NODE_ENV === 'development') {
        mongoose.connection.on('open', () => {
          console.log('MongoDB connection opened');
          
          // Log connection pool stats
          setInterval(() => {
            const poolStats = mongoose.connection.db.admin().serverStatus().connections;
            console.log(`MongoDB connections - current: ${poolStats.current}, available: ${poolStats.available}`);
          }, 60000); // Every minute
        });
      }

      // Graceful shutdown
      process.on('SIGINT', async () => {
        try {
          await mongoose.connection.close();
          console.log('MongoDB connection closed through app termination');
          clearInterval(memoryCheckInterval);
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
        console.error('Failed to connect to MongoDB after 3 attempts');
        process.exit(1);
      }
      
      // Exponential backoff
      const delay = Math.pow(2, 3 - retries) * 1000;
      console.log(`Retrying in ${delay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

module.exports = connectDB; 