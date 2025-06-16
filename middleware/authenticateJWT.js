/*const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Récupérer le token du header Authorization

  if (!token) {
    return res.sendStatus(403); // Forbidden
  }

  jwt.verify(token, 'mySuperSecretKey123!@#', (err, user) => {
    if (err) {
      return res.sendStatus(403); // Forbidden
    }
    req.user = user; // Stocker les informations de l'utilisateur dans la requête
    next(); // Passer au middleware suivant
  });
};

module.exports = authenticateJWT;*/