const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Créer un transporteur
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // Options de l'email
  const mailOptions = {
    from: 'Votre application <no-reply@yourapp.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // Envoyer l'email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;