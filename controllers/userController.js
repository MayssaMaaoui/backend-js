const User = require('../models/User');
const Group = require('../models/Group');
const bcrypt = require('bcryptjs');
const { sendVerificationEmail } = require('../config/nodemailer');
const { verifyToken } = require('../middleware/authMiddleware');

exports.createUser = async (req, res) => {
  try {
    const photoPath = req.file ? `/uploads/${req.file.filename}` : null;
    const { name, email, password, phone, groupe, poste } = req.body;

    // Vérification des champs requis
    if (!name || !email || !password || !groupe || !poste) {
      return res.status(400).json({ message: 'Tous les champs requis (name, email, password, groupe, poste) doivent être fournis' });
    }

    // Validation du format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Format d\'email invalide' });
    }

    // Vérification si le groupe existe
    const groupExists = await Group.findOne({ id_groupe: groupe });
    if (!groupExists) {
      return res.status(400).json({ message: `Le groupe ${groupe} n'existe pas` });
    }

    // Vérification de l'unicité de l'email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Cet email est déjà utilisé' });
    }

    // Vérification du format de l'image si un fichier est téléchargé
    if (req.file) {
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ message: 'Format de fichier invalide (JPEG, PNG, JPG, WEBP uniquement)' });
      }
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Création de l'utilisateur
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone: phone || null, // Champ optionnel
      groupe,
      poste, // Ajout du poste
      photo: photoPath
    });

    await user.save();

    // Suppression du mot de passe avant de retourner la réponse
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({ message: 'Utilisateur créé avec succès', user: userResponse });
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Erreur de validation', error: error.message });
    }

    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};


// Route pour la connexion de l'utilisateur
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe sont requis' });
    }
    if (!user.password) {
  return res.status(500).json({ message: "Erreur serveur : le mot de passe est manquant dans la base de données" });
}


    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérification du mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Mot de passe incorrect' });
    }

    // Générer un JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    console.log("🟢 Token généré :", token);

    res.status(200).json({
      message: 'Connexion réussie',
      token: token, // Renvoyer le token
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

exports.getUserByEmail = async (req, res) => {
  const email = req.params.email;
  const user = await User.findOne({ email });

  if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
  }

  res.json(user);
};

// Mettre à jour un utilisateur

exports.updateUser = async (req, res) => {
  try {
    // Vérification du token
    verifyToken(req, res, async () => {
      const { id } = req.params;
      const { groupe, password, ...updateData } = req.body;

      if (req.file) {
        updateData.photo = `/uploads/${req.file.filename}`;
      }

      if (groupe) {
        const groupExists = await Group.findById(groupe);
        if (!groupExists) {
          return res.status(400).json({ message: 'Groupe non trouvé' });
        }
        updateData.groupe = groupe;
      }

      if (password) {
        if (typeof password !== 'string' || password.trim() === '') {
          return res.status(400).json({ message: 'Mot de passe invalide ou vide' });
        }
        updateData.password = await bcrypt.hash(password, 10);
      }
      

      const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

      if (!updatedUser) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      // Supprimer le mot de passe avant de renvoyer la réponse
      const userResponse = updatedUser.toObject();
      delete userResponse.password;

      res.json({ message: 'Utilisateur mis à jour avec succès', user: userResponse });
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};


// Supprimer un utilisateur
exports.deleteUser = async (req, res) => {
  try {
    verifyToken(req, res, async () => {
      const deletedUser = await User.findByIdAndDelete(req.params.id);
      if (!deletedUser) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
      res.json({ message: 'Utilisateur supprimé avec succès' });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

