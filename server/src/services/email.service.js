const nodemailer = require('nodemailer');

const smtpUser = process.env.SMTP_USER?.trim();
const smtpPassword = process.env.SMTP_APP_PASSWORD?.replace(/\s+/g, '');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: smtpUser,
    pass: smtpPassword,
  },
});

const sendPasswordResetEmail = async (email, resetToken) => {
  const clientUrl = process.env.CLIENT_URL;

  if (!clientUrl || !smtpUser || !smtpPassword) {
    throw new Error(
      'Email service is not configured. Set CLIENT_URL, SMTP_USER, and SMTP_APP_PASSWORD.'
    );
  }

  const resetLink = `${clientUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(resetToken)}`;

  await transporter.sendMail({
    from: `"Thriftpedia" <${smtpUser}>`,
    to: email,
    subject: 'Reset Your Thriftpedia Password',
    text: [
      'Hello!',
      '',
      'We received a request to reset your Thriftpedia password.',
      '',
      `Reset your password using this link: ${resetLink}`,
      '',
      'This link will expire in 15 minutes.',
      'If you did not request a password reset, you can ignore this email.',
      '',
      'Thriftpedia Team',
    ].join('\n'),
  });
};

module.exports = { sendPasswordResetEmail };
