# Shree Consultancy — Admin Dashboard

A separate Next.js app, deployed independently to `admin.shreeconsultancy.com`.
The public site never contains any of this code, at build time or runtime —
it's a different deployment entirely.

**This app holds no database connection.** All data lives in the
standalone `backend` service (see `/backend`); this app's own API routes
are thin proxies that check the browser's session cookie, then forward
the request to `backend` with a server-to-server key. See "How auth
crosses the two services" below for why it's split this way.

## Setup
```
npm install
cp .env.local.example .env.local

openssl rand -hex 32        # → SESSION_SECRET
# BACKEND_API_KEY must be the exact same value set in backend/.env
```

Admin accounts are not configured here — create one in `backend`:
```
cd ../backend && npm run create-admin -- you@example.com "your password" "Your Name"
```

```
npm run dev                 # runs on :3001 by default
```

This needs `backend` running too (see `/backend/README.md`) — every tab,
and login itself, reads through it.

Sign in at `/login` with the email and password you just created.

## Tabs
- **Pipeline** (`/dashboard`) — Kanban board. Drag cards between stages,
  toggle **blocked**, click a card for its detail drawer. The stats strip
  above the board is computed from live data fetched through `backend`.
- **Project detail drawer** — ledger entries persist via `backend`. The
  **Document Engine** still generates PDFs client-side via `jspdf`;
  marking a document generated is saved server-side, and generating the
  Final Invoice creates a real invoice record that shows up on the
  Invoices tab. **Send to Client** now sends a real email via `backend`
  (Resend) — the recipient defaults to the project's contact email if it
  has one (leads from the intake form do; manually-created or
  tender-converted projects don't, so you'll need to fill it in), and can
  optionally attach whichever PDF was just generated in this session.
- **Tender Inbox** (`/tenders`) — **Convert** creates a project and marks
  the tender converted, both persisted through `backend`.
- **Invoices** (`/invoices`) — **Mark paid** persists. Reminder counts
  come from the dunning service, via `backend`.
- **Team** (`/team`) — read-only.

## How auth crosses the two services

The browser only ever talks to this app — never directly to `backend`.
That's deliberate: the `admin_session` cookie is scoped to this subdomain
only (no `domain` attribute, same as before), so it can't leak to the
public site or be sent anywhere else, even by mistake. Widening that
cookie's scope so the browser could call `backend` directly would have
undone exactly the isolation the two-app split was built to guarantee.

Instead: this app's API routes check the session cookie themselves
(`lib/requireSession.js`), then make their own server-to-server request
to `backend` with a static `x-api-key` header (`lib/backendClient.js`).
`backend` trusts that key, not the browser — it has no idea what a
session cookie even is.

## How the pieces fit together
- `middleware.js` — checks every request except `/login` and
  `/api/auth/*` for a valid `admin_session` cookie. Edge runtime.
- `lib/session.js` — signs and verifies that cookie.
- `lib/requireSession.js` — the in-handler session check every API route
  calls before it does anything.
- `lib/backendClient.js` — the one place `BACKEND_URL`/`BACKEND_API_KEY`
  are used; every proxy route and every server-rendered page goes through
  this instead of calling `fetch` directly.
- `app/api/projects`, `/tenders`, `/invoices`, `/team` — thin proxies:
  check session, forward to `backend`, return its response.
- `app/api/auth/login/route.js` — rate-limits per email locally, then
  calls `backend`'s `/auth/verify` to check the credentials against the
  real `AdminUser` table, and issues the session cookie on success. This
  is the one route that has to stay here rather than moving entirely to
  `backend`, since issuing the cookie is inseparable from the browser
  request that arrives here.
- `app/api/dispatch/route.js` — thin proxy, same pattern as the other
  routes: checks session, forwards to `backend`'s `/dispatch`, which
  sends the real email.

## What's still a placeholder, on purpose

1. **No self-service password reset or roles yet.** Every `AdminUser` can
   do everything — there's no "read-only" or "billing-only" role. Adding
   one means adding a `role` column and checking it in `backend`'s
   routes; the schema deliberately doesn't guess at what roles you'll
   actually need yet.
2. **No file storage.** Generated PDFs only exist in the browser and, for
   the length of one dispatch request, in transit to Resend — they
   aren't saved anywhere. Reopening a project's drawer later means
   regenerating a document before you can email it again. CAD files
   still need S3/R2 entirely from scratch.
3. **The two in-memory rate limiters** (login here, leads in `backend`)
   reset on restart and don't share state across multiple instances.

## Deploying
Deploy this as its own project (e.g. a Vercel project pointed at this
subdirectory). Set `SESSION_SECRET`, `BACKEND_URL` (the deployed
backend's URL), and `BACKEND_API_KEY` (matching backend's own env) in
the host's environment settings. Create the first real login by running
`npm run create-admin` against the deployed backend's database (or
locally with `DATABASE_URL` pointed at production, for a one-off).

## Theming

Light and dark, with light as the default (the client asked for a
light-first UI). The switch is the sun/moon control in the top bar.

Mechanically: every colour resolves to a CSS variable defined in
`app/globals.css`, which `tailwind.config.js` exposes as semantic tokens
(`bg`, `surface`, `fg`, `accent`, `warn`). Because the variables hold bare
`R G B` triplets wrapped in `rgb(... / <alpha-value>)`, opacity modifiers
keep working — `text-fg/60` is correct in both themes, and no component
needs a `dark:` variant anywhere.

`lib/theme.js` holds the storage key and the inline script that sets
`data-theme` on `<html>` before first paint. That script is what stops a
dark-mode user seeing a white flash on every navigation; it has to stay
inline and synchronous in `app/layout.jsx`.

To make the theme follow the OS setting instead of defaulting to light,
change `DEFAULT_THEME` in `lib/theme.js` to `'system'`.

## Roles

The signed-in user's role rides in the session cookie and is shared with
client components through `components/RoleContext.jsx`. A `viewer` sees
every tab but no write controls, and the top bar shows a "read-only" badge
so the missing buttons are explained rather than confusing.

This is presentation only. The real enforcement is in the backend (see
`backend/README.md`), which rejects writes from viewers regardless of what
the UI renders.
