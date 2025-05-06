const nodemailer = require('nodemailer');

// Créez un transporteur
const transporter = nodemailer.createTransport({
  service: 'gmail', // Utilisez un autre service si nécessaire
  auth: {
    user: process.env.EMAIL_USER, // Votre email
    pass: process.env.EMAIL_PASS  // Votre mot de passe ou un mot de passe d'application
  }
});

// Fonction pour envoyer l'email
function sendVerificationEmail(to, verificationCode) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'Code de vérification pour réinitialisation de mot de passe',
    text: `Voici votre code de vérification : ${verificationCode}. Ce code expire dans 10 minutes.`
  };

  return transporter.sendMail(mailOptions);
}
