// src/models/State.js
const mongoose = require('mongoose');

const stateSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true 
  },
  code: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true 
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('State', stateSchema);