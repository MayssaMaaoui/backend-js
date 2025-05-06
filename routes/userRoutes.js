// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth'); // Import corrigé
router.post('/users', upload.single('photo'), userController.createUser);
router.post('/login', loginUser);



// Route dashboard utilisateur
/*router.get('/dashboard', protect, (req, res) => {
  res.json({
    message: 'Bienvenue sur le dashboard utilisateur',
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email
    }
  });
});*/

module.exports = router;