import { NextResponse } from 'next/server';
import { createSessionToken } from '../../../../lib/session';
import { backendFetch } from '../../../../lib/backendClient';

// Credentials are checked against the real AdminUser table in `backend`
// (see backend/src/routes/auth.js), not against env vars — accounts are
// created/reset with `npm run create-admin` in the backend folder, which
// means real per-person accounts and password changes with no redeploy.
//
// This route still owns the session cookie itself, on purpose: it's the
// one piece of "auth" that has to live here rather than in `backend`,
// since issuing the cookie is inseparable from the browser request that
// arrives here.

// Extremely simple in-memory rate limit: 5 attempts per email per 10
// minutes. Resets on server restart and doesn't share state across
// serverless instances — good enough to slow down casual brute-forcing on
// a single-instance deployment, not a substitute for a real solution
// (e.g. Upstash rate limiting) if this ever sits behind heavier traffic.
const attempts = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

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

export async function POST(request) {
  let email, password;
  try {
    ({ email, password } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  if (isRateLimited(email.toLowerCase())) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again in a few minutes.' },
      { status: 429 }
    );
  }

  const { data, status } = await backendFetch('/auth/verify', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (status !== 200) {
    return NextResponse.json({ error: data.error || 'Invalid credentials' }, { status: status || 401 });
  }

  const token = await createSessionToken({
    sub: data.user.id,
    email: data.user.email,
    name: data.user.name,
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set('admin_session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours, matches createSessionToken's default TTL
    // No `domain` set on purpose — this scopes the cookie to
    // admin.shreeconsultancy.com only, never the parent domain.
  });
  return response;
}