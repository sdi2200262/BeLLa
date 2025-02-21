const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  repositoryUrl: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  uploadedBy: {
    type: String,
    required: true,
    trim: true
  },
  isBellaProject: {
    type: Boolean,
    required: true,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Project', projectSchema); 