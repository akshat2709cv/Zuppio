const nodemailer = require("nodemailer");

function hasSmtpConfig() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_PASS !== "PASTE_GMAIL_APP_PASSWORD_HERE" &&
      process.env.MAIL_FROM
  );
}

function createTransporter() {
  if (!hasSmtpConfig()) {
    const error = new Error("Email service is not configured.");
    error.code = "EMAIL_CONFIG_MISSING";
    throw error;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

async function sendSnackDropConfirmation(email) {
  const transporter = createTransporter();

  return transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: "Thank you for contacting ZUPPIO",
    text: "Thank you for contacting us. We will get back to you soon.",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#17111f">
        <h2 style="margin:0 0 12px;color:#8A2BE2">Thank you for contacting ZUPPIO</h2>
        <p>Thank you for contacting us. We will get back to you soon.</p>
        <p style="margin-top:18px;color:#555">Crunch Karo, Smile Karo.</p>
      </div>
    `
  });
}

module.exports = {
  sendSnackDropConfirmation
};
