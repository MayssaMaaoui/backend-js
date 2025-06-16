const User = require('../models/User');
const Group = require('../models/Group');
const bcrypt = require('bcryptjs');

exports.createUser = async (req, res) => {
  try {
    const photoPath = req.file ? `/uploads/${req.file.filename}` : null;
    const { name, email, password, phone, groupe, poste } = req.body;

    // Validation des champs
    if (!name || !email || !password || !groupe || !poste) {
      return res.status(400).json({ message: 'Tous les champs requis doivent être fournis' });
    }

    // Vérification du groupe
    const groupExists = await Group.findOne({ id_groupe: groupe });
    if (!groupExists) {
      return res.status(400).json({ message: `Le groupe ${groupe} n'existe pas` });
    }

    // Vérification de l'email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Cet email est déjà utilisé' });
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone: phone || null,
      groupe,
      poste,
      photo: photoPath
    });

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({ message: 'Utilisateur créé avec succès', user: userResponse });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Login simplifié (sans JWT)
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non trouvé' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Mot de passe incorrect' });
    }

    // Retourne les infos utilisateur sans token
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      message: 'Connexion réussie',
      user: userResponse
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Récupérer tous les utilisateurs
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().populate('groupe', 'name_groupe');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupérer un utilisateur par email
exports.getUserByEmail = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour un utilisateur (sans vérification de token)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { groupe, password, ...updateData } = req.body;

    if (req.file) {
      updateData.photo = `/uploads/${req.file.filename}`;
    }

    if (groupe) {
      const groupExists = await Group.findById(groupe);
      if (!groupExists) return res.status(400).json({ message: 'Groupe non trouvé' });
      updateData.groupe = groupe;
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, { 
      new: true, 
      runValidators: true 
    });

    if (!updatedUser) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const userResponse = updatedUser.toObject();
    delete userResponse.password;

    res.json({ message: 'Utilisateur mis à jour avec succès', user: userResponse });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Supprimer un utilisateur (sans vérification de token)
exports.deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};