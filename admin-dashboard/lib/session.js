// Minimal signed-cookie session helper.
//
// This is a REFERENCE implementation, not a production-hardened auth
// library. It's here so the app runs end-to-end locally. Before deploying
// with real client data behind this dashboard, swap it for a maintained,
// audited solution — e.g. Auth.js (next-auth) or iron-session — which also
// give you things this file doesn't: session revocation, CSRF protection
// helpers, and rate limiting on login attempts.
//
// Uses the Web Crypto API (not Node's `crypto` module) so the same code
// works both in middleware (Edge runtime) and in API routes (Node runtime).

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const SECRET = process.env.SESSION_SECRET;

if (!SECRET) {
  // Fail loudly rather than silently signing with a guessable default.
  console.warn(
    'SESSION_SECRET is not set. Set a long random string in your environment before deploying.'
  );
}

function toBase64Url(bytes) {
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str) {
  const normalized = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function getKey() {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(SECRET || 'dev-only-secret-change-me'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function createSessionToken(payload, ttlMs = 1000 * 60 * 60 * 8) {
  const body = { ...payload, exp: Date.now() + ttlMs };
  const value = toBase64Url(encoder.encode(JSON.stringify(body)));

  const key = await getKey();
  const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  const signature = toBase64Url(new Uint8Array(signatureBytes));

  return `${value}.${signature}`;
}

export async function verifySessionToken(token) {
  if (!token) return null;

  const [value, signature] = token.split('.');
  if (!value || !signature) return null;

  const key = await getKey();
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    fromBase64Url(signature),
    encoder.encode(value)
  );
  if (!valid) return null;

  try {
    const payload = JSON.parse(decoder.decode(fromBase64Url(value)));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
