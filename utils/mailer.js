const nodemailer = require("nodemailer");

const createTransporter = async () => {
  if (process.env.NODE_ENV === "test") {
    return {
      sendMail: async ({ to, subject, text, html }) => ({ to, subject, text, html, info: "skipped" }),
    };
  }

  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth: await nodemailer.createTestAccount(),
  });
};

const sendMail = async ({ to, subject, text, html }) => {
  const transporter = await createTransporter();

  const message = {
    from: process.env.EMAIL_FROM || "no-reply@blogplatform.com",
    to,
    subject,
    text,
    html,
  };

  const info = await transporter.sendMail(message);

  if (process.env.EMAIL_HOST) {
    return info;
  }

  console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
  return info;
};

module.exports = sendMail;
