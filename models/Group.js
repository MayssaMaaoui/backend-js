const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  id_groupe: {
    type: Number,
    unique: true,
    required: true,
    alias: 'id' // Permet d'utiliser 'id' comme alias pour 'id_groupe'
  },
  name_groupe: {
    type: String,
    required: [true, 'Le nom du groupe est requis'],
    unique: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  }
}, { timestamps: true });

module.exports = mongoose.model('Group', groupSchema);