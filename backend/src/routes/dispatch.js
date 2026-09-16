const express = require('express');
const { asyncHandler } = require('../asyncHandler');
const { sendEmail } = require('../email');
const router = express.Router();

// Called by admin-dashboard's own /api/dispatch proxy (session-checked
// there, API-key-checked here — see server.js). The PDF, if any, comes
// straight from the browser's jsPDF output in this same request: there's
// no file storage yet (see README), so an attachment only exists for as
// long as it takes to send it. Reopening the drawer later and hitting
// Send again means regenerating the document first.
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { to, subject, message, attachment } = req.body;
    if (!to || !subject || !message) {
      return res.status(400).json({ error: 'to, subject and message are required' });
    }

    const attachments = attachment?.contentBase64
      ? [{ filename: attachment.filename, content: attachment.contentBase64 }]
      : [];

    const result = await sendEmail({ to, subject, html: message, attachments });
    res.json({ ok: true, id: result.id });
  })
);

module.exports = router;