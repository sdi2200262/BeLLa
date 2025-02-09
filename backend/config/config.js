// Lines 1-6: Load and export environment variables (or fallback defaults)
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5001,
  dbUri: process.env.DB_URI || 'mongodb://localhost:27017/monorepo-template'
}; 