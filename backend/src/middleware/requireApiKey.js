// Guards every route that only admin-dashboard's own Next.js server
// should call — never the browser directly. admin-dashboard already
// checked the user's session cookie before making this request; this
// just confirms the caller is admin-dashboard's server and not something
// else on the internet.
function requireApiKey(req, res, next) {
  const expected = process.env.BACKEND_API_KEY;
  if (!expected) {
    console.warn('BACKEND_API_KEY is not set — rejecting all requests.');
    return res.status(500).json({ error: 'Server misconfigured' });
  }
  if (req.headers['x-api-key'] !== expected) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
}
module.exports = { requireApiKey };
