# Shree Consultancy — Backend

A standalone Express + Prisma API, deployed independently from both
Next.js apps (e.g. to `api.shreeconsultancy.com`). Owns the Postgres
database — nothing else in this repo talks to Postgres directly.

## Why a separate service instead of Next.js API routes

- **Deployment.** This runs anywhere a plain Node process runs (Railway,
  Render, Fly.io, a VM, a container) instead of being tied to a
  serverless function's constraints — steadier database connection
  pooling, no cold-start-per-route behavior, one place to scale
  independently of either frontend.
- **One database owner.** `admin-dashboard`, `automations/tender-scraper`,
  and `automations/dunning` all talk to this over plain HTTP. None of
  them hold a Postgres connection or a Prisma client of their own.
- **Docker-friendly.** A `Dockerfile` is included; this is the piece most
  likely to run in a container behind a reverse proxy.

## Who calls what, and how each authenticates

| Caller | Routes | Auth |
|---|---|---|
| admin-dashboard's Next.js server | `/auth/verify`, `/projects`, `/tenders`, `/invoices`, `/team`, `/dispatch` | `x-api-key: BACKEND_API_KEY` |
| Public marketing site (browser) | `POST /leads` | none — public, CORS-scoped to `PUBLIC_SITE_URL`, rate-limited per IP |
| tender-scraper / dunning services | `/automation/*` | `x-automation-token: AUTOMATION_TOKEN` |

Two separate secrets on purpose — `BACKEND_API_KEY` and
`AUTOMATION_TOKEN` — so rotating one (say, after a scraper server is
decommissioned) doesn't touch the other.

Note what's *not* here: there's no browser-facing session handling in
this service. The session cookie itself still lives in `admin-dashboard`
— this service just answers "are these credentials valid" (via
`/auth/verify`, checked against the real `AdminUser` table) and trusts
that admin-dashboard's server already validated the session cookie
before forwarding any other request here. The browser never talks to
this service directly.

## Setup
```
npm install
cp .env.example .env
# fill in DATABASE_URL, then:
npx prisma migrate dev --name init
npm run seed

# generate the two secrets:
openssl rand -hex 32   # → BACKEND_API_KEY
openssl rand -hex 32   # → AUTOMATION_TOKEN

# create your own login — no default account ships with this codebase:
npm run create-admin -- you@example.com "your password" "Your Name"

npm run dev             # runs on :4000 by default (Node 18.11+, for --watch)
```

Real outbound email needs a [Resend](https://resend.com) API key in
`.env` (`RESEND_API_KEY`, `EMAIL_FROM`) — without it, both `/dispatch`
and the dunning reminder will throw rather than send.

Re-run `create-admin` with the same email any time to reset that
person's password, or with a new email to add another account — there's
no limit on how many `AdminUser` rows exist, unlike the single
env-var-based account this replaced.

## Routes
- `GET /health` — plain liveness check, no auth.
- `POST /auth/verify` — checks email/password against `AdminUser`,
  called only by admin-dashboard's login route.
- `GET /projects`, `POST /projects`, `PATCH /projects/:id`,
  `POST /projects/:id/ledger`
- `GET /tenders`, `PATCH /tenders/:id` (`{status}` or `{action: 'convert'}`)
- `GET /invoices`, `PATCH /invoices/:id`
- `GET /team`
- `POST /dispatch` — sends a real email via Resend, with an optional
  real PDF attachment (base64, passed straight through from the
  browser's freshly-generated jsPDF output — see admin-dashboard's
  ProjectDrawer).
- `POST /leads` — public
- `POST /automation/tenders`, `GET /automation/invoices`,
  `POST /automation/invoices/:id/remind` (this one also sends the actual
  reminder email — the dunning service only decides *when*, not *how*)

## Deploying
Any host that runs a long-lived Node process works — Railway, Render,
Fly.io, or your own VM/container behind Nginx. The included `Dockerfile`
covers the container path:
```
docker build -t shree-backend .
docker run -p 4000:4000 --env-file .env shree-backend
```
Point `api.shreeconsultancy.com` at wherever this ends up, then set
`BACKEND_URL=https://api.shreeconsultancy.com` in admin-dashboard's
environment and in each automation service's environment.

## What's still a placeholder, on purpose
Same items called out in admin-dashboard's README: no file storage for
CAD files/PDFs beyond the length of one dispatch request, and the
in-memory `/leads` rate limiter resets on restart and doesn't share
state across multiple instances.

## Roles

Every `AdminUser` row carries a `role`:

- `admin` — can do everything (the default).
- `viewer` — can read every tab, cannot change anything.

```bash
npm run create-admin -- someone@example.com "their password" "Their Name" viewer
```

Enforcement is server-side, in `src/middleware/requireWriteAccess.js`: any
non-GET request carrying `x-user-role: viewer` is rejected with 403. The
dashboard also hides write controls for viewers, but that is only an
affordance — hiding a button is not access control, and the middleware is
what actually holds.

`/auth/verify` is deliberately exempt: it's a POST, and a viewer still has
to be able to sign in.

## Object storage

`src/storage.js` talks to any S3-compatible bucket — AWS S3 or Cloudflare
R2 unchanged, since R2 speaks the same API. Only `STORAGE_ENDPOINT` and
`STORAGE_REGION` differ between them.

It is **optional at runtime**, not just at setup. With `STORAGE_*` blank,
the rest of the service works normally; the file routes return 503 with a
message saying storage isn't configured, and the dashboard shows that
rather than breaking. Uploaded filenames are reduced to a sanitised
basename before becoming object keys, so a hostile filename cannot climb
out of its project prefix.

Buckets stay private — downloads are short-lived signed URLs, never a
public bucket policy.

## Tests

```bash
npm test
```

Covers the pure logic worth protecting: object-key sanitisation and the
read-only guard. No database or network needed, so CI runs it on every
push.
