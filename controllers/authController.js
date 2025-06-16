const bcrypt = require('bcryptjs');
const User = require('../models/User');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// Connexion simplifiée (sans token)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email }).select('+password').populate('groupe');
    
    // Vérification de l'utilisateur et du mot de passe
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    // Retourne les infos utilisateur sans token
    res.json({ 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.groupe?.name_groupe || 'default'
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Mot de passe oublié (fonctionne sans JWT)
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Aucun utilisateur trouvé avec cet email' });
    }

    // Génération d'un token simple (pas JWT)
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken; // On stocke le token directement
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    // Envoi de l'email
    const resetUrl = `${req.protocol}://${req.get('host')}/api/users/reset-password/${resetToken}`;
    await sendEmail({
      email: user.email,
      subject: 'Réinitialisation de mot de passe',
      message: `Cliquez ici pour réinitialiser votre mot de passe : ${resetUrl}`,
    });

    res.status(200).json({ message: 'Email envoyé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Réinitialisation du mot de passe (sans JWT)
exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    // Recherche de l'utilisateur par token (non hashé)
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Token invalide ou expiré' });
    }

    // Mise à jour du mot de passe
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();
    res.status(200).json({ message: 'Mot de passe réinitialisé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Middleware de protection factice (optionnel)
exports.protect = (req, res, next) => {
  next(); // Laisse passer toutes les requêtes
};