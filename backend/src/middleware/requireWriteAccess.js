// Blocks mutations from read-only accounts.
//
// This service has no notion of a browser session — admin-dashboard checks
// the session cookie and forwards the signed-in user's role as
// `x-user-role` on each server-to-server call (see its lib/backendClient.js).
// We trust that header for the same reason we trust BACKEND_API_KEY: only
// admin-dashboard's server can set it, and the key proves the caller is
// that server. It is NOT something a browser can forge, because browsers
// never reach this service directly.
//
// Reads are always allowed; a viewer is meant to see everything. Requests
// with no role header at all (the automation services, and any internal
// caller predating roles) are allowed through — this middleware is only
// mounted on the API-key routes, so there's no anonymous path into it.
function requireWriteAccess(req, res, next) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();

  const role = req.headers['x-user-role'];
  if (role && role !== 'admin') {
    return res.status(403).json({ error: 'This account is read-only.' });
  }

  next();
}

module.exports = { requireWriteAccess };
