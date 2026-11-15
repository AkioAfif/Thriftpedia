// Sends mail through Brevo's HTTPS API. SMTP is not used because Railway blocks outbound
// SMTP on its lower plans. Brevo can send to any recipient once the sender address in
// EMAIL_FROM is verified (Brevo > Senders), so no custom domain is needed.
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

// "Thriftpedia <me@gmail.com>" -> { name: 'Thriftpedia', email: 'me@gmail.com' }; a bare address also works.
function parseSender(value) {
  const match = /^\s*(.*?)\s*<([^<>\s]+@[^<>\s]+)>\s*$/.exec(value);
  if (match) {
    const name = match[1].replace(/^"|"$/g, '');
    return name ? { name, email: match[2] } : { email: match[2] };
  }
  if (/^[^<>\s]+@[^<>\s]+$/.test(value)) return { email: value };
  return null;
}

const sendPasswordResetEmail = async (email, resetToken) => {
  const clientUrl = process.env.CLIENT_URL;
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const sender = parseSender(process.env.EMAIL_FROM?.trim() ?? '');

  if (!clientUrl) {
    throw new Error('CLIENT_URL is not configured');
  }
  if (!apiKey || !sender) {
    throw new Error('BREVO_API_KEY and EMAIL_FROM (e.g. "Thriftpedia <me@gmail.com>") must be configured');
  }

  const resetLink = `${clientUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(resetToken)}`;

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender,
      to: [{ email }],
      subject: 'Reset Your Thriftpedia Password',
      textContent: [
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
    throw new Error(`Brevo rejected the email (${response.status}): ${detail}`);
  }
};

module.exports = { sendPasswordResetEmail, parseSender };
