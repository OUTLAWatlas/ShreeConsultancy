const express = require('express');
const bcrypt = require('bcryptjs');
const { prisma } = require('../db');
const { asyncHandler } = require('../asyncHandler');
const router = express.Router();

// Called only by admin-dashboard's own login route (server-to-server,
// behind requireApiKey — see server.js) — never by a browser directly.
// admin-dashboard still owns the actual session cookie; this just
// answers "are these credentials valid" against the real AdminUser
// table instead of a single hardcoded env-var account.
router.post(
  '/verify',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const user = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    res.json({ user: { id: user.id, email: user.email, name: user.name } });
  })
);

module.exports = router;