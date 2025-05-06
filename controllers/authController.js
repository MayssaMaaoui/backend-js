const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail'); // Utilitaire pour envoyer des emails
// controllers/authController.js
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email }).populate('groupe');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    const token = user.generateAuthToken();
    res.json({ 
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.groupe.name_groupe
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Mot de passe oublié
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Aucun utilisateur trouvé avec cet email' });
    }

    // Générer un token de réinitialisation
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    // Envoyer l'email
    const resetUrl = `${req.protocol}://${req.get('host')}/api/users/reset-password/${resetToken}`;
    const message = `Vous avez demandé une réinitialisation de mot de passe. Cliquez sur ce lien pour réinitialiser votre mot de passe : ${resetUrl}`;

    await sendEmail({
      email: user.email,
      subject: 'Réinitialisation de mot de passe',
      message,
    });

    res.status(200).json({ message: 'Un email de réinitialisation a été envoyé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Réinitialisation du mot de passe
exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    // Vérifier le token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Token invalide ou expiré' });
    }

    // Mettre à jour le mot de passe
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Middleware pour protéger les routes
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Non autorisé, pas de token' });
  }

  try {
    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch (error) {
    res.status(401).json({ message: 'Non autorisé, token invalide' });
  }
};