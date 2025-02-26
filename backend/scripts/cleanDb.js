/**
 * Database Cleanup Script
 * 
 * This script removes the Ollama repository and any other corrupted data
 * from the database.
 * 
 * Usage: 
 * 1. Make sure MongoDB connection string is in .env file
 * 2. Run: node scripts/cleanDb.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const Project = require('../src/models/Project');
const Like = require('../src/models/Like');

// MongoDB connection string - replace with your actual connection string
const MONGODB_URI = 'mongodb://localhost:27017/bella';

async function cleanDatabase() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Find and remove Ollama repository
    const ollamaRepo = await Project.findOne({
      repositoryUrl: { $regex: /ollama/i }
    });

    if (ollamaRepo) {
      console.log(`Found Ollama repository: ${ollamaRepo.repositoryUrl}`);
      
      // Delete the project
      await Project.deleteOne({ _id: ollamaRepo._id });
      console.log('Deleted Ollama repository');
      
      // Delete associated likes
      const deletedLikes = await Like.deleteMany({ projectId: ollamaRepo._id });
      console.log(`Deleted ${deletedLikes.deletedCount} likes associated with Ollama repository`);
    } else {
      console.log('No Ollama repository found');
    }

    // Find and list all projects
    const projects = await Project.find({}).select('repositoryUrl uploadedBy');
    console.log('\nRemaining projects in database:');
    if (projects.length === 0) {
      console.log('No projects found');
    } else {
      projects.forEach(project => {
        console.log(`- ${project.repositoryUrl} (uploaded by ${project.uploadedBy})`);
      });
    }

    console.log('\nDatabase cleanup completed successfully');
  } catch (error) {
    console.error('Error during database cleanup:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
}

// Run the cleanup
cleanDatabase(); 