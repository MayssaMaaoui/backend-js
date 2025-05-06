const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const upload = require('../config/multer');
const multer = require('multer');

const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ 
      message: 'Erreur d\'upload de fichier',
      details: err.message 
    });
  }
  next(err);
};
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(new Error('Format de fichier invalide (JPEG/PNG uniquement)'), false);
  }
};

router.post(
  '/',
  upload.single('photo'),
  handleUploadError,
  userController.createUser
);

module.exports = router;