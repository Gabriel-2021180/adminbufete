// emailConfig.js
const path = require('path');
require('dotenv').config();
const nodemailer = require('nodemailer');
console.log(process.env.EMAIL_USER, process.env.EMAIL_PASSWORD);
const emailTransporter = nodemailer.createTransport({
  service: 'gmail', // Utiliza Gmail para este ejemplo
  auth: {
    user: 'bufetedeabogadosazyas@gmail.com',
    pass: 'jwnrudbwurwovncw',
  },
  
});

emailTransporter.verify()
  .then(() => {
    console.log('Autenticación correcta');
  })
  .catch((err) => {
    console.error(`Error de autenticación: ${err}`);
  });

module.exports = emailTransporter;
