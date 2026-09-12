# Shree Consultancy — Admin Dashboard

A separate Next.js app, deployed independently to `admin.shreeconsultancy.com`.
The public site never contains any of this code, at build time or runtime —
it's a different deployment entirely.

## Setup
```
npm install
cp .env.local.example .env.local   # set a real SESSION_SECRET
openssl rand -hex 32               # generates a good value for it
npm run dev                        # runs on :3001 by default
```

## How the pieces fit together
- `middleware.js` — checks every request except `/login` and `/api/auth/*`
  for a valid `admin_session` cookie. No valid session → redirect to
  `/login`. Runs on the Edge runtime.
- `app/api/auth/login/route.js` — verifies credentials (currently a stub —
  see below) and, on success, sets an `httpOnly`, `secure` session cookie.
  No `domain` attribute is set, so the cookie is scoped to this subdomain
  only and is never visible to the public site, even in principle.
- `app/api/auth/logout/route.js` — clears the cookie.
- `app/dashboard/page.jsx` — the protected page. Reads the session
  server-side to know who's signed in.
- `lib/session.js` — signs and verifies the session token with HMAC-SHA256
  via the Web Crypto API, so the same code runs in both the Edge middleware
  and the Node API routes.

## Before you put real data behind this
Two things in here are placeholders, on purpose:

1. **`verifyCredentials()` in `app/api/auth/login/route.js` always returns
   `null`.** Wire it to your actual user store — look up the user by email,
   compare the password with `bcrypt.compare` (never plaintext), and return
   the user record on success.

2. **`lib/session.js` is a minimal reference implementation**, not an
   audited auth library. It correctly signs and verifies cookies and checks
   expiry, but it doesn't give you session revocation (there's no way to
   invalidate a token before it expires short of rotating `SESSION_SECRET`
   for everyone), CSRF protection, or login rate-limiting. For a real
   deployment, consider swapping this for **Auth.js (next-auth)** or
   **iron-session** — both are maintained, widely audited, and handle these
   cases for you. Keeping the hand-rolled version is fine for a low-value
   internal tool used by one person, but worth revisiting if the dashboard
   ever handles client-sensitive data at scale.

## Deploying
Deploy this as its own project (e.g. a second Vercel project pointed at the
same repo but this subdirectory, or its own repo entirely). Add
`admin.shreeconsultancy.com` as its domain and set `SESSION_SECRET` in the
host's environment settings — don't commit it.
