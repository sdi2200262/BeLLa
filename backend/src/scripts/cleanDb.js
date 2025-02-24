require('dotenv').config();
const mongoose = require('mongoose');

async function cleanDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Drop the projects collection
    await mongoose.connection.collection('projects').drop();
    console.log('Projects collection dropped successfully');

    // Optional: Drop other collections if needed
    // await mongoose.connection.collection('users').drop();
    // console.log('Users collection dropped successfully');

  } catch (error) {
    if (error.code === 26) {
      console.log('Collection does not exist, already clean');
    } else {
      console.error('Error cleaning database:', error);
    }
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
}

cleanDatabase(); 