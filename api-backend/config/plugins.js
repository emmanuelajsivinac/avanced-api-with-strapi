/*module.exports = () => ({});
uked labm pdsm babx */
module.exports = ({ env }) => ({
  email: {
    config: {
      provider: "nodemailer",
      providerOptions: {
        host: "smtp.gmail.com", // Para Gmail
        port: 587,
        secure: false, // true solo si usas 465
        auth: {
          user: env("SMTP_EMAIL"), // Tu correo personal
          pass: env("SMTP_PASSWORD"), // App Password de Gmail si tienes 2FA
        },
      },
      settings: {
        defaultFrom: env("SMTP_EMAIL"), // Debe ser tu mismo correo
        defaultReplyTo: env("SMTP_EMAIL"),
      },
    },
  },
});
