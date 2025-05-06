// models/Counter.js
const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true 
  },
  sequence: { 
    type: Number, 
    default: 1 
  }
});

// Ajoutez cette partie cruciale
const Counter = mongoose.model('Counter', counterSchema);
module.exports = Counter;