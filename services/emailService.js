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

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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

async function sendInquiryNotification(type, inquiry) {
  if (!process.env.MAIL_TO) {
    const error = new Error("MAIL_TO is not configured.");
    error.code = "EMAIL_CONFIG_MISSING";
    throw error;
  }

  const labels = {
    contact: "Contact Message",
    dealer: "Dealer Inquiry",
    wholesale: "Wholesale Inquiry"
  };
  const label = labels[type] || "Website Inquiry";
  const fields = [
    ["Name", inquiry.name],
    ["Business Name", inquiry.businessName],
    ["Email", inquiry.email],
    ["Phone", inquiry.phone],
    ["Subject", inquiry.subject],
    ["City", inquiry.city],
    ["State", inquiry.state],
    ["Address", inquiry.address],
    ["Business Type", inquiry.businessType],
    ["Product Interest", inquiry.productInterest],
    ["Quantity Requirement", inquiry.quantityRequirement],
    ["Message", inquiry.message],
    ["Submitted At", inquiry.createdAt],
    ["IP Address", inquiry.ip]
  ].filter((field) => field[1]);
  const transporter = createTransporter();

  return transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: process.env.MAIL_TO,
    subject: `New ZUPPIO ${label}`,
    text: fields.map(([name, value]) => `${name}: ${value}`).join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#17111f">
        <h2 style="margin:0 0 16px;color:#5b2aa5">New ZUPPIO ${escapeHtml(label)}</h2>
        <table style="border-collapse:collapse;width:100%;max-width:720px">
          ${fields.map(([name, value]) => `
            <tr>
              <th style="border:1px solid #ddd;padding:8px;text-align:left;vertical-align:top">${escapeHtml(name)}</th>
              <td style="border:1px solid #ddd;padding:8px;white-space:pre-wrap">${escapeHtml(value)}</td>
            </tr>
          `).join("")}
        </table>
      </div>
    `
  });
}

module.exports = {
  sendInquiryNotification,
  sendSnackDropConfirmation
};
