require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { requireApiKey } = require('./middleware/requireApiKey');
const { requireAutomationToken } = require('./middleware/requireAutomationToken');
const { requireWriteAccess } = require('./middleware/requireWriteAccess');
const authRouter = require('./routes/auth');
const projectsRouter = require('./routes/projects');
const tendersRouter = require('./routes/tenders');
const invoicesRouter = require('./routes/invoices');
const teamRouter = require('./routes/team');
const leadsRouter = require('./routes/leads');
const automationRouter = require('./routes/automation');
const dispatchRouter = require('./routes/dispatch');

const app = express();
// Generated PDFs arrive as base64 JSON on /projects/:id/documents, which
// blows past express.json's 100kb default. 25mb covers a large document
// with room to spare; genuine CAD files go through multipart upload
// instead and are capped separately in routes/projects.js.
app.use(express.json({ limit: '25mb' }));

app.get('/health', (req, res) => res.json({ ok: true }));

// Public — the marketing site's intake form posts here directly. CORS is
// scoped to just this one route; nothing else needs to be reachable from
// a browser at all.
app.use(
  '/leads',
  cors({ origin: process.env.PUBLIC_SITE_URL || false, methods: ['POST'] }),
  leadsRouter
);

// Shared-secret protected — called by the standalone tender-scraper and
// dunning services, never by a browser.
app.use('/automation', requireAutomationToken, automationRouter);

// API-key protected — called only by admin-dashboard's own Next.js
// server (a trusted server-to-server caller that has already checked the
// browser's session cookie), never directly by a browser.
// NB: /auth is intentionally NOT behind requireWriteAccess — verifying
// credentials is a POST, and a viewer has to be able to sign in.
app.use('/auth', requireApiKey, authRouter);
app.use('/projects', requireApiKey, requireWriteAccess, projectsRouter);
app.use('/tenders', requireApiKey, requireWriteAccess, tendersRouter);
app.use('/invoices', requireApiKey, requireWriteAccess, invoicesRouter);
app.use('/team', requireApiKey, requireWriteAccess, teamRouter);
app.use('/dispatch', requireApiKey, requireWriteAccess, dispatchRouter);

// Catches anything asyncHandler forwarded, and anything else that slips
// through. Keep this last.
app.use((err, req, res, next) => {
  console.error(err);

  // Multer's own size-limit error, so the dashboard can say something
  // useful instead of "internal server error".
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'That file is too large (50MB limit).' });
  }

  // storage.js tags its "not configured" error with 503 and a message
  // meant for the user — pass those through rather than swallowing them.
  if (err.statusCode) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend listening on :${PORT}`));