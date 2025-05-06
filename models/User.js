const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Group = require('./Group'); // Assurez-vous que ce fichier existe

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Le nom est requis'],
    trim: true
  },
  email: { 
    type: String, 
    required: [true, 'L\'email est requis'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email invalide']
  },
  password: { 
    type: String, 
    required: [true, 'Le mot de passe est requis'],
    minlength: [6, '6 caractères minimum']
  },
  phone: { 
    type: String, 
    required: [true, 'Le numéro de téléphone est requis']
  },
  poste: { 
    type: String, 
    required: [true, 'Le poste est requis']
  },
  photo: { 
    type: String // Stocker seulement le chemin du fichier
  },
  groupe: {
    type: Number,
    required: [true, 'Le groupe est requis'],
    validate: {
      validator: async function(value) {
        return await Group.exists({ id_groupe: value }); // Vérifier si le groupe existe
      },
      message: 'Aucun groupe trouvé avec l\'ID {VALUE}'
    }
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,

  resetToken: { type: String, default: null }, // Ajoute ce champ
  resetTokenExpiry: { type: Date, default: null }, // Pour l'expiration

}, { timestamps: true });

// Méthode de comparaison de mot de passe
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
