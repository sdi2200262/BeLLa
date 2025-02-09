const mongoose = require('mongoose');
const config = require('./config');

async function connectDB() {
  try {
    await mongoose.connect(config.dbUri);
    console.log('MongoDB connected successfully.');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
}

connectDB();

module.exports = mongoose; 