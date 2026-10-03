const express = require('express');
const { prisma } = require('../db');
const { asyncHandler } = require('../asyncHandler');
const { sendEmail } = require('../email');
const { getDownloadUrl } = require('../storage');
const router = express.Router();

// Called by admin-dashboard's own /api/dispatch proxy (session-checked
// there, API-key-checked here — see server.js).
//
// An attachment is referenced by `fileId` — a persisted ProjectFile (see
// routes/projects.js) — rather than raw bytes in the request. The browser
// uploads a freshly generated PDF to /projects/:id/documents first, then
// dispatches by its id. Besides keeping request bodies small, this is what
// makes a document generated weeks ago still attachable.
//
// `attachment.contentBase64` is still accepted as a fallback for the case
// where object storage isn't configured: the PDF then exists only in the
// browser, so it has to ride along in the request or there's nothing to
// send.
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { to, subject, message, fileId, attachment } = req.body;
    if (!to || !subject || !message) {
      return res.status(400).json({ error: 'to, subject and message are required' });
    }

    let attachments = [];

    if (fileId) {
      const file = await prisma.projectFile.findUnique({ where: { id: Number(fileId) } });
      if (!file) return res.status(404).json({ error: 'File not found' });
      // Resend fetches the file from this URL itself rather than us pulling
      // the whole thing into memory first — matters once CAD files get big.
      attachments = [{ filename: file.filename, path: await getDownloadUrl(file.key) }];
    } else if (attachment?.contentBase64) {
      attachments = [{ filename: attachment.filename, content: attachment.contentBase64 }];
    }

    const result = await sendEmail({ to, subject, html: message, attachments });
    res.json({ ok: true, id: result.id });
  })
);

module.exports = router;
