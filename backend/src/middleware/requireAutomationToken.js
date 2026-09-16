// Guards the /automation/* routes, called by the standalone scraper and
// dunning services — separate processes with their own shared secret,
// distinct from BACKEND_API_KEY so the two can be rotated independently.
function requireAutomationToken(req, res, next) {
  const expected = process.env.AUTOMATION_TOKEN;
  if (!expected) {
    console.warn('AUTOMATION_TOKEN is not set — rejecting all automation requests.');
    return res.status(500).json({ error: 'Server misconfigured' });
  }
  if (req.headers['x-automation-token'] !== expected) {
    return res.status(401).json({ error: 'Invalid automation token' });
  }
  next();
}
module.exports = { requireAutomationToken };
