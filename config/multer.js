const multer = require('multer');
const path = require('path');

// Définir le stockage des fichiers dans "public/uploads"
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Renommer le fichier avec un timestamp
  }
});

// Accepter tous les types d'images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Seuls les fichiers image sont autorisés !'), false);
  }
};

// Configurer Multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter
});

module.exports = upload;
