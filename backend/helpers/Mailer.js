import nodemailer from "nodemailer";

export const mailer = nodemailer.createTransport({
  host: process.env.MAIL_HOST,                 // e.g., sandbox.smtp.mailtrap.io
  port: Number(process.env.MAIL_PORT || 2525),
  secure: String(process.env.MAIL_SECURE || "false") === "true",
  auth: {
    user: process.env.MAIL_USER,              // ⬅️ Mailtrap Sandbox SMTP USERNAME
    pass: process.env.MAIL_PASS,              // ⬅️ Mailtrap Sandbox SMTP PASSWORD
  },
});

export async function sendResetEmail(to, url) {
  const from = process.env.MAIL_FROM || process.env.MAIL_USER;
  return mailer.sendMail({
    from,
    to,
    subject: "Reset your password",
    html: `
      <p>You requested a password reset.</p>
      <p><a href="${url}">Click here to reset your password</a></p>
      <p>This link expires in 30 minutes. If you didn't request this, ignore this email.</p>
    `,
    text: `Reset your password: ${url}`,
  });
}
