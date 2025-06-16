require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/public', express.static('public'));

// Connexion à MongoDB
connectDB();

// Import des routes
const userRoutes = require('./routes/users');
const groupRoutes = require('./routes/groups');

// Utilisation des routes
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api', userRoutes);

// Middleware pour gérer les erreurs de JSON malformé
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'JSON mal formé : Vérifiez les guillemets et la ponctuation' });
  }
  next();
});

// Middleware pour les erreurs 404
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// Middleware pour les erreurs serveur
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Erreur serveur interne' });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

server.on('error', error => {
  if (error.code === 'EADDRINUSE') {
    console.log(`⚠️  Le port ${PORT} est occupé, tentative sur ${Number(PORT) + 1}`);
    app.listen(Number(PORT) + 1);
  }
});


