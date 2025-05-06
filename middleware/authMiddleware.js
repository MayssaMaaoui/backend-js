const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ message: '⚠ Aucun token trouvé. L\'utilisateur doit se reconnecter.' });
  }

  try {
    const verified = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
    req.user = verified; // Ajoute l'utilisateur vérifié à la requête
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token invalide ou expiré. Veuillez vous reconnecter.' });
  }

  
};
