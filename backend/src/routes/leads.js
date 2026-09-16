const express = require('express');
const { prisma } = require('../db');
const { asyncHandler } = require('../asyncHandler');
const router = express.Router();

// Public route — the marketing site's intake form posts here directly,
// cross-origin, with no session (a visitor filling out a contact form
// obviously isn't signed into the admin dashboard). CORS for this path
// is configured in server.js. Rate-limited per IP, the same simple way
// admin-dashboard rate-limits login attempts: good enough to blunt
// casual spam on a single instance, not a substitute for a real service
// if this ever gets targeted seriously.
const attempts = new Map();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function isRateLimited(key) {
  const now = Date.now();
  const record = attempts.get(key);
  if (!record || now - record.windowStart > WINDOW_MS) {
    attempts.set(key, { count: 1, windowStart: now });
    return false;
  }
  record.count += 1;
  return record.count > MAX_ATTEMPTS;
}

const DISCIPLINE_BY_TYPE = {
  'Switchyard / Substation': 'Electrical',
  'Industrial Plant': 'Electrical',
  'Renewable / Solar': 'Electrical',
  'Water & Utility': 'Civil',
  Other: 'Electrical',
};

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.ip || 'unknown';
    if (isRateLimited(ip)) {
      return res.status(429).json({ error: 'Too many submissions. Try again later.' });
    }

    const { type, budget, sqft, name, email, company } = req.body;
    if (!name || !email || !budget) {
      return res.status(400).json({ error: 'name, email and budget are required' });
    }

    const project = await prisma.project.create({
      data: {
        title: `${type || 'New enquiry'} — ${company || name}`,
        client: company || name,
        discipline: DISCIPLINE_BY_TYPE[type] || 'Electrical',
        value: Number(budget),
        stage: 'New Leads',
        source: 'lead-form',
        contactName: name,
        contactEmail: email,
        contactCompany: company || null,
        sqft: sqft ? Number(sqft) : null,
      },
    });

    res.status(201).json({ ok: true, id: project.id });
  })
);

module.exports = router;
