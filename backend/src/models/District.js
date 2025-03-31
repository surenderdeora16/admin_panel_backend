// src/models/District.js
const mongoose = require('mongoose');

const districtSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  stateId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'State', 
    required: true 
  },
  code: { 
    type: String, 
    required: true, 
    trim: true 
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true 
});

// Compound index for faster queries
districtSchema.index({ stateId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('District', districtSchema);