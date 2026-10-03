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
      // Resend takes either a `path` URL it fetches itself, or raw base64
      // content. Support both: stored files pass a signed storage URL,
      // while a PDF that only exists in the browser (storage not
      // configured) has to send its bytes. The regex strips the data: URI
      // prefix jsPDF's datauristring output carries.
      attachments: attachments.map((a) =>
        a.path
          ? { filename: a.filename, path: a.path }
          : { filename: a.filename, content: a.content.replace(/^data:.*;base64,/, '') }
      ),
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Resend API error: ${res.status} ${JSON.stringify(data)}`);
  }
  return data;
}

module.exports = { sendEmail };