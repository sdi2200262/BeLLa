const express = require('express');
const cors = require('cors');
const db = require('../config/database'); // Initializes the database connection
require('dotenv').config();

const app = express();
const config = require('../config/config');

// Enable CORS for frontend
app.use(cors());
app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  res.send(`
    <html>
      <body style="background: black; color: white; font-family: Arial, sans-serif; text-align: center; min-height: 65vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div style="max-width: 600px;">
          <h1 style="font-size: 4.5rem; margin-bottom: 0.5rem;">BeLLa</h1>
          <div style="height: 1px; background: linear-gradient(to right, transparent, white, transparent); margin: 2.5rem 0;"></div>
          <h2 style="color: rgba(255,255,255,0.9); margin-bottom: 1rem;">Backend Server is running at port ${config.port}</h2>
          <p style="color: rgba(255,255,255,0.6); margin-bottom: 1rem;">The API is ready to accept requests.</p>
          <p style="color: rgba(255,255,255,0.6);">
            Try the API endpoint at: 
            <a href="/api" style="color: rgba(255,255,255,0.9); text-decoration: none; transition: color 0.2s;"
               onmouseover="this.style.color='rgba(0, 132, 255, 0.6)'" 
               onmouseout="this.style.color='rgba(255,255,255,0.9)'">
              /api
            </a>
          </p>
        </div>
      </body>
    </html>
  `);
});

// Sample API endpoint
app.get('/api', (req, res) => {
  res.json({ message: 'Hello from the backend API!' });
});

// More routes and middleware can be added here

module.exports = app; 