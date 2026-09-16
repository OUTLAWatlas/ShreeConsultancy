# Shree Consultancy — Repo Structure

Four independently-deployable pieces:

```
shree-consultancy/
  public-site/          → deploy to shreeconsultancy.com
  admin-dashboard/       → deploy to admin.shreeconsultancy.com (Next.js UI only — no DB)
  backend/               → deploy to api.shreeconsultancy.com (Express + Prisma + Postgres)
  automations/
    tender-scraper/      → standalone script, run on a nightly cron
    dunning/               → standalone script, run on a daily cron
```

## Why this split
`backend` is the only piece that talks to Postgres. `admin-dashboard`,
`tender-scraper`, and `dunning` all reach it over plain HTTP, each with
its own auth:

- **admin-dashboard → backend**: server-to-server only, using a static
  `x-api-key`. The browser never talks to `backend` directly — it only
  ever talks to `admin-dashboard`, whose session cookie stays scoped to
  the admin subdomain exactly as before. See
  `admin-dashboard/README.md` → "How auth crosses the two services" for
  why it's built this way rather than sharing the cookie across
  subdomains.
- **public-site → backend**: the intake form POSTs a lead straight to
  `backend`'s public `/leads` route (CORS-scoped to the public site's
  origin, rate-limited). No admin-dashboard involvement.
- **tender-scraper / dunning → backend**: a separate shared secret,
  `x-automation-token`, distinct from admin-dashboard's key so either can
  be rotated independently.

The public site's JS bundle still contains no admin code whatsoever —
that property is unchanged.

## Local development
```
cd backend && npm install
cp .env.example .env                    # see backend/README.md for each var
npx prisma migrate dev --name init
npm run seed
npm run create-admin -- you@example.com "your password" "Your Name"
npm run dev                             # localhost:4000

cd ../admin-dashboard && npm install
cp .env.local.example .env.local        # BACKEND_URL=http://localhost:4000, same BACKEND_API_KEY
npm run dev                             # localhost:3001

cd ../public-site && npm install
cp .env.local.example .env.local        # NEXT_PUBLIC_API_URL=http://localhost:4000
npm run dev                             # localhost:3000

cd ../automations/tender-scraper && npm install && npx playwright install chromium
cp .env.example .env                    # BACKEND_URL=http://localhost:4000, same AUTOMATION_TOKEN
npm start                               # run manually, or on a cron

cd ../dunning && npm install
cp .env.example .env
npm start
```

## Deployment
- **backend** needs a long-lived Node host (Railway, Render, Fly.io, a
  VM/container — a `Dockerfile` is included) and a Postgres database
  (`DATABASE_URL`).
- **public-site** and **admin-dashboard** each deploy as their own
  Next.js project (e.g. two Vercel projects pointed at this repo with
  different Root Directories).
- **tender-scraper** and **dunning** aren't web apps — they run wherever
  you already run scheduled jobs (a small VM with cron, a scheduled
  GitHub Actions workflow, a serverless cron product), calling the
  deployed `backend`'s API.

See each folder's own README for the details specific to that piece.