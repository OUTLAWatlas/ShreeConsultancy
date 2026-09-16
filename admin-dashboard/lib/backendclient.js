// Every admin-dashboard API route that needs data calls the standalone
// backend service through this, instead of holding its own database
// connection. BACKEND_API_KEY is a server-to-server secret — it's never
// sent to the browser, only attached here, on requests this Next.js
// server makes on its own behalf after it has already checked the
// caller's session cookie.
const BACKEND_URL = process.env.BACKEND_URL;
const BACKEND_API_KEY = process.env.BACKEND_API_KEY;

export async function backendFetch(path, options = {}) {
  if (!BACKEND_URL || !BACKEND_API_KEY) {
    throw new Error('BACKEND_URL / BACKEND_API_KEY are not set.');
  }

  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': BACKEND_API_KEY,
      ...(options.headers || {}),
    },
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}