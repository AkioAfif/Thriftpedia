const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_APP_PASSWORD,
  },
});

const sendPasswordResetEmail = async (email, resetToken) => {
  const clientUrl = process.env.CLIENT_URL;

  if (!clientUrl) {
    throw new Error('CLIENT_URL is not configured');
  }

  const resetLink = `${clientUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(resetToken)}`;

  await transporter.sendMail({
    from: `"Thriftpedia" <${process.env.SMTP_USER}>`,
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
