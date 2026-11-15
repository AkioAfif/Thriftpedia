// Sends mail through Resend's HTTPS API. SMTP is not used because Railway blocks outbound
// SMTP on its lower plans.
const RESEND_API_URL = 'https://api.resend.com/emails';

const sendPasswordResetEmail = async (email, resetToken) => {
  const clientUrl = process.env.CLIENT_URL;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!clientUrl) {
    throw new Error('CLIENT_URL is not configured');
  }
  if (!apiKey || !from) {
    throw new Error('RESEND_API_KEY and EMAIL_FROM must be configured');
  }

  const resetLink = `${clientUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(resetToken)}`;

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
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
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Resend rejected the email (${response.status}): ${detail}`);
  }
};

module.exports = { sendPasswordResetEmail };
