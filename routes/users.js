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
  
      // Comparaison du mot de passe
      const match = await bcrypt.compare(password, user.password);
  
      if (!match) {
        return res.status(401).json({ message: 'Mot de passe incorrect' });
      }
  
      // Générez un token ou d'autres actions ici
      res.status(200).json({ message: 'Connexion réussie' });
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
      return res.status(400).json({ message: 'Utilisateur non trouvé' });
    }
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 heure
    await user.save(); // Enregistrez une seule fois

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
      subject: 'Réinitialisation de mot de passe',
      text: `Voici votre code de réinitialisation : ${resetToken}`,
    };
    console.log("Token généré :", resetToken);


    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'email', error });
      }
      res.status(200).json({ message: 'Code de réinitialisation envoyé par email' });
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
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
router.get('/me', authenticateJWT, async (req, res) => {
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
  
  // Modifiez la route comme ceci :
  router.post(
    '/',
    upload.single('photo'),
    (req, res, next) => {
      // Traitement normal
      next();
    },
    handleUploadError, // Utilisez le middleware de gestion d'erreurs
    userController.createUser
  );
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