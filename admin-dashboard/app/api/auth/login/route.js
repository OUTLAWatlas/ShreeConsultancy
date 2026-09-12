import { NextResponse } from 'next/server';
import { createSessionToken } from '../../../../lib/session';

// STUB — replace with a real lookup against your user store.
// Passwords must be hashed at rest and compared with a constant-time
// comparison (e.g. bcrypt.compare), never checked in plaintext.
//
// Example once wired up:
//   const user = await db.user.findUnique({ where: { email } });
//   if (!user) return null;
//   const valid = await bcrypt.compare(password, user.passwordHash);
//   return valid ? user : null;
async function verifyCredentials(email, password) {
  return null; // always rejects until this is implemented
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

  const user = await verifyCredentials(email, password);
  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = await createSessionToken({ sub: user.id, email: user.email });

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
