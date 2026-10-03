// Every admin-dashboard API route that needs data calls the standalone
// backend service through this, instead of holding its own database
// connection. BACKEND_API_KEY is a server-to-server secret — it's never
// sent to the browser, only attached here, on requests this Next.js
// server makes on its own behalf after it has already checked the
// caller's session cookie.
import { cookies } from 'next/headers';
import { verifySessionToken } from './session';

const BACKEND_URL = process.env.BACKEND_URL;
const BACKEND_API_KEY = process.env.BACKEND_API_KEY;

// The backend enforces read-only accounts, but it has no session of its
// own — it trusts this header because only this server can set it, and
// the API key proves the caller is this server. Browsers never reach the
// backend directly, so there's nothing for a user to forge.
async function roleHeader() {
  try {
    const session = await verifySessionToken(cookies().get('admin_session')?.value);
    return session?.role ? { 'x-user-role': session.role } : {};
  } catch {
    // Called outside a request scope (shouldn't happen, but don't take
    // the whole request down over a header).
    return {};
  }
}

export async function backendFetch(path, options = {}) {
  if (!BACKEND_URL || !BACKEND_API_KEY) {
    throw new Error('BACKEND_URL / BACKEND_API_KEY are not set.');
  }

  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': BACKEND_API_KEY,
      ...(await roleHeader()),
      ...(options.headers || {}),
    },
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

// Forwards a browser's multipart upload (CAD files) straight through.
//
// Note the absent Content-Type: the fetch runtime derives it from the
// FormData body, including the multipart boundary. Setting it by hand
// produces a boundary-less header and the upload silently fails to parse.
export async function backendFetchMultipart(path, formData) {
  if (!BACKEND_URL || !BACKEND_API_KEY) {
    throw new Error('BACKEND_URL / BACKEND_API_KEY are not set.');
  }

  const res = await fetch(`${BACKEND_URL}${path}`, {
    method: 'POST',
    headers: { 'x-api-key': BACKEND_API_KEY, ...(await roleHeader()) },
    body: formData,
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}
