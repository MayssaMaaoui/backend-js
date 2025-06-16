const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authController = require('../controllers/authController'); // Nouveau contrôleur pour l'authentification
const authenticateJWT = require('../middleware/authenticateJWT'); // Assurez-vous que le chemin est correct
const authenticate = require('../middleware/authMiddleware'); // Middleware d'authentification
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const User = require('../models/User');  // Chemin relatif vers le modèle User
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Route pour enregistrer un nouvel utilisateur
router.post('/register', async (req, res) => {
    const { email, password } = req.body;
    
    try {
      // Hachage du mot de passe
      const hashedPassword = await bcrypt.hash(password, 10); // Le "10" est le nombre de tours de salage (salt rounds)
      
      const newUser = new User({
        email,
        password: hashedPassword,
      });
  
      await newUser.save();
      res.status(201).json({ message: 'Utilisateur créé avec succès' });
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  });

  router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
      const user = await User.findOne({ email });
      
      if (!user) {
        return res.status(400).json({ message: 'Utilisateur non trouvé' });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ message: 'Mot de passe incorrect' });
      }

      // Alternative dans la route login
          const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            poste: user.poste,
            groupe: user.groupe,
            profileImage: user.profileImage || 'default.jpg'
            // ... autres champs sauf le password
          };

          res.status(200).json({ 
            message: 'Connexion réussie',
            user: userResponse
          });
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Route pour oublier le mot de passe
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  
  try {
    const user = await User.findOne({ email });
    if (!user) {
      // Don't tell the user the email doesn't exist (security best practice)
      return res.status(200).json({ 
        message: 'If an account exists with this email, reset instructions have been sent'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour
    
    // Update user with reset token
    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    // Create reusable transporter object
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'mayssamaaoui056@gmail.com',
        pass: process.env.EMAIL_PASS || 'avqb zcie jonv wvjl',
      },
    });

    // Email options
    const resetUrl = `http://192.168.1.9:3000/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    
    const mailOptions = {
      from: '"Your App Name" <mayssamaaoui056@gmail.com>',
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h2>Password Reset</h2>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
    
    res.status(200).json({ 
      message: 'If an account exists with this email, reset instructions have been sent'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      message: 'An error occurred while processing your request',
      error: error.message 
    });
  }
});

router.get('/get-reset-token', async (req, res) => {
  const { email } = req.query;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    if (user.resetTokenExpiry < Date.now()) {
      return res.status(400).json({ message: 'Le token de réinitialisation a expiré' });
    }
    res.json({ resetToken: user.resetToken });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Dans votre backend Node.js
router.get('/me', async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      username: user.username,
      email: user.email,
      phone: user.phone,
      poste: user.poste,
      groupe: user.groupe,
      profileImage: user.profileImage || 'default.jpg'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route pour réinitialiser le mot de passe
  router.post('/reset-password', async (req, res) => {
    const { email, resetToken, newPassword } = req.body;
  
    try {
      // Vérifiez si l'utilisateur existe dans la base de données
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Utilisateur non trouvé' });
      }
  
      // Vérifiez si le code est correct et n'est pas expiré
      if (user.resetToken !== resetToken || user.resetTokenExpiry < Date.now()) {
        return res.status(400).json({ message: 'Code de réinitialisation invalide ou expiré' });
      }
  
      // Changer le mot de passe (avec bcrypt pour hacher le mot de passe)
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(newPassword, 10);
  
      user.password = hashedPassword;
      user.resetToken = undefined; // Réinitialiser le token après la réinitialisation
      user.resetTokenExpiry = undefined;
      await user.save();
  
      res.status(200).json({ message: 'Mot de passe réinitialisé avec succès' });
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  });
  
  module.exports = router;
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ 
        message: 'Erreur d\'upload de fichier',
        details: err.message 
      });
    }
    next(err);
  };
  
  const sendWelcomeEmail = async (email, password, name) => {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'mayssamaaoui056@gmail.com',  
        pass: 'avqb zcie jonv wvjl',  
      },
    });
  
    const mailOptions = {
      from: 'mayssamaaoui056@gmail.com',
      to: email,
      subject: 'Bienvenue sur notre application!',
      html: `
        <h1>Bienvenue ${name}!</h1>
        <p>Votre compte a été créé avec succès.</p>
        <p>Voici vos informations de connexion :</p>
        <ul>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Mot de passe temporaire:</strong> ${password}</li>
        </ul>
        <p>Nous vous recommandons de changer votre mot de passe après votre première connexion.</p>
      `,
    };
  
    await transporter.sendMail(mailOptions);
  };

  // Modifiez la route comme ceci :
  router.post('/', async (req, res) => {
    try {
      const { name, email, password, phone, poste, groupe } = req.body;
      
      // Hachage du mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const newUser = new User({
        name,
        email,
        password: hashedPassword,
        phone,
        poste,
        groupe
      });
  
      await newUser.save();
  
      // Envoi de l'email de bienvenue (en arrière-plan, ne pas bloquer la réponse)
      sendWelcomeEmail(email, password, name)
        .catch(error => console.error('Erreur lors de l\'envoi de l\'email:', error));
  
      res.status(201).json({ 
        message: 'Utilisateur créé avec succès',
        user: {
          _id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          poste: newUser.poste,
          groupe: newUser.groupe
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  });
router.post('/login', authController.login); // Connexion
router.post('/forgot-password', authController.forgotPassword); // Mot de passe oublié
router.post('/reset-password/:token', authController.resetPassword); // Réinitialisation du mot de passe
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users); // Renvoie une liste directement
} catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
}
  });
// Routes protégées (utilisateurs)
router.use(authController.protect); // Appliquer le middleware protect à toutes les routes suivantes
router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);

router.put('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.status(200).json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.get('/:email', userController.getUserByEmail);

module.exports = router;
