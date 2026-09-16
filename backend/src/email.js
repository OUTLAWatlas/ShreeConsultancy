// Thin wrapper around Resend's HTTP API. No SDK dependency — just fetch,
// consistent with the rest of this codebase (the automation scripts and
// admin-dashboard's backendClient all do the same thing). Swap the body
// of sendEmail() if you pick a different provider (Postmark, SES, etc.)
// — every caller in this file only depends on this one function's shape.
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM;

async function sendEmail({ to, subject, html, attachments = [] }) {
  if (!RESEND_API_KEY || !EMAIL_FROM) {
    throw new Error('RESEND_API_KEY / EMAIL_FROM are not set.');
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to,
      subject,
      html,
      // Resend wants raw base64 — strip a data: URI prefix if the caller
      // passed one straight from something like jsPDF's datauristring output.
      attachments: attachments.map((a) => ({
        filename: a.filename,
        content: a.content.replace(/^data:.*;base64,/, ''),
      })),
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Resend API error: ${res.status} ${JSON.stringify(data)}`);
  }
  return data;
}

module.exports = { sendEmail };