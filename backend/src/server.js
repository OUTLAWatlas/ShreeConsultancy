require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { requireApiKey } = require('./middleware/requireApiKey');
const { requireAutomationToken } = require('./middleware/requireAutomationToken');
const authRouter = require('./routes/auth');
const projectsRouter = require('./routes/projects');
const tendersRouter = require('./routes/tenders');
const invoicesRouter = require('./routes/invoices');
const teamRouter = require('./routes/team');
const leadsRouter = require('./routes/leads');
const automationRouter = require('./routes/automation');
const dispatchRouter = require('./routes/dispatch');

const app = express();
app.use(express.json());

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
app.use('/auth', requireApiKey, authRouter);
app.use('/projects', requireApiKey, projectsRouter);
app.use('/tenders', requireApiKey, tendersRouter);
app.use('/invoices', requireApiKey, invoicesRouter);
app.use('/team', requireApiKey, teamRouter);
app.use('/dispatch', requireApiKey, dispatchRouter);

// Catches anything asyncHandler forwarded, and anything else that slips
// through. Keep this last.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend listening on :${PORT}`));