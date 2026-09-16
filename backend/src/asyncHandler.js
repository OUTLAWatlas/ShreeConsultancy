// Express (v4) doesn't catch rejected promises from async route handlers
// on its own — this wraps a handler so a thrown error reaches the error
// middleware in server.js instead of hanging the request.
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
module.exports = { asyncHandler };
