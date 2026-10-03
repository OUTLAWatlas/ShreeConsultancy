# Deployment

Four pieces deploy independently:

| Piece | What it is | Goes to | Cost |
|---|---|---|---|
| `backend` | Express + Prisma API, owns Postgres | Railway | ~$5/mo |
| `public-site` | Next.js marketing site | Vercel | free |
| `admin-dashboard` | Next.js internal console | Vercel (second project) | free |
| `automations/*` | Two scheduled scripts | GitHub Actions | free |

Plus Cloudflare (domain + R2 file storage) and Resend (email).

**Deploy in the order below.** `backend` has to exist before the frontends have anything to point at, and the domain has to exist before you can set the final URLs.

---

## 0. Before you start

Generate the three secrets now and keep them somewhere safe — you'll paste each into more than one place, and they must match exactly:

```bash
openssl rand -hex 32   # SESSION_SECRET      (admin-dashboard only)
openssl rand -hex 32   # BACKEND_API_KEY     (backend + admin-dashboard)
openssl rand -hex 32   # AUTOMATION_TOKEN    (backend + GitHub Actions)
```

A mismatch in `BACKEND_API_KEY` is the single most common cause of "the dashboard loads but every tab is empty" — it means every backend call is returning 401.

---

## 1. Domain (Cloudflare)

1. Buy `shreeconsultancy.com` at **Cloudflare Registrar** (dash.cloudflare.com → Domain Registration). It sells at cost with no renewal markup, and you need a Cloudflare account for R2 anyway.
2. Once it's registered, Cloudflare is already its DNS provider — nothing to transfer.

You'll add three DNS records later, once you know where each service lives:

| Subdomain | Points at |
|---|---|
| `shreeconsultancy.com` | Vercel (public site) |
| `admin.shreeconsultancy.com` | Vercel (admin dashboard) |
| `api.shreeconsultancy.com` | Railway (backend) |

> **Turn the orange cloud OFF (DNS only)** for all three. Vercel and Railway terminate TLS themselves; proxying through Cloudflare on top causes redirect loops and certificate-issuance failures.

---

## 2. Object storage (Cloudflare R2)

Optional at this stage — **everything else works without it.** PDFs still generate and download, email still sends. Only CAD uploads, persisting generated PDFs, and attaching a stored file to an email need it, and each fails with a clear message until it's configured.

1. dash.cloudflare.com → **R2** → enable it (a payment method may be required even though usage stays inside the free 10GB tier; R2 charges nothing for egress, which is the cost that would otherwise matter here).
2. **Create bucket** — lowercase and hyphens, e.g. `shree-consultancy-files`. Location: Automatic.
3. **Manage R2 API Tokens** → **Create Account API Token**:
   - Permissions: **Object Read & Write**
   - Apply to **specific buckets** → just the one you created
4. Copy all three values it shows you — **the secret is shown exactly once**:
   - Access Key ID
   - Secret Access Key
   - S3 API endpoint (`https://<account-id>.r2.cloudflarestorage.com`)

No bucket CORS setup is needed: only the backend talks to R2, never the browser. The bucket stays private — downloads go through short-lived signed URLs the backend generates.

---

## 3. Email (Resend)

1. Sign up at resend.com and add `shreeconsultancy.com` as a domain.
2. It gives you DKIM/SPF records — add them in Cloudflare DNS (these **do** stay DNS-only too).
3. Wait for verification, then create an API key.

Until the domain is verified you can only send to your own address, which is enough to test with.

---

## 4. Backend + Postgres (Railway)

1. railway.app → **New Project** → **Deploy from GitHub repo** → pick this repo.
2. In the service settings, set **Root Directory** to `backend`. Without this Railway tries to build the repo root and fails.
3. Add a database: **New** → **Database** → **PostgreSQL**. Railway injects `DATABASE_URL` into the service automatically — don't paste one by hand.
4. Set the remaining variables (service → **Variables**):

```
BACKEND_API_KEY=<the one you generated>
AUTOMATION_TOKEN=<the one you generated>
PUBLIC_SITE_URL=https://shreeconsultancy.com
RESEND_API_KEY=<from Resend>
EMAIL_FROM=Shree Consultancy <billing@shreeconsultancy.com>

# only if you did step 2
STORAGE_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
STORAGE_REGION=auto
STORAGE_BUCKET=shree-consultancy-files
STORAGE_ACCESS_KEY_ID=<from R2>
STORAGE_SECRET_ACCESS_KEY=<from R2>
```

`PORT` is injected by Railway; the server already reads it.

5. **Run the migrations.** From the Railway service's shell (or locally with `DATABASE_URL` pointed at the Railway database):

```bash
npx prisma migrate deploy
```

Use `migrate deploy`, not `migrate dev` — `dev` can prompt and, worse, offers to reset the database.

6. **Seed the reference data** (team members and sample rows), optional but gives the Team tab content:

```bash
npm run seed
```

7. **Create your login** — no account ships with this codebase:

```bash
npm run create-admin -- you@shreeconsultancy.com "a strong password" "Your Name"
```

Add read-only accounts with a fourth argument:

```bash
npm run create-admin -- viewer@shreeconsultancy.com "their password" "Their Name" viewer
```

8. Railway → **Settings** → **Networking** → **Custom Domain** → `api.shreeconsultancy.com`. It gives you a CNAME target; add it in Cloudflare (DNS only).

9. Verify: `curl https://api.shreeconsultancy.com/health` → `{"ok":true}`

---

## 5. Public site (Vercel)

1. vercel.com → **Add New** → **Project** → import this repo.
2. **Root Directory**: `public-site`. Framework preset: Next.js (auto-detected).
3. Environment variables:

```
NEXT_PUBLIC_API_URL=https://api.shreeconsultancy.com
NEXT_PUBLIC_ADMIN_URL=https://admin.shreeconsultancy.com
NEXT_PUBLIC_SITE_URL=https://shreeconsultancy.com
```

These are `NEXT_PUBLIC_*`, meaning they are **baked into the browser bundle** — correct here (they're all public URLs), but never put a secret behind that prefix.

4. Deploy, then **Settings → Domains** → add `shreeconsultancy.com` and follow the DNS instructions.

5. **Add the globe texture.** The globe looks for `/textures/earth.jpg` in `public-site/public/`. Without it the globe still renders as a wireframe (it degrades deliberately), but with it you get the full effect. Any equirectangular Earth image works — NASA's public-domain *Blue Marble* at 2048×1024 is the usual choice. Commit it to `public-site/public/textures/earth.jpg`.

---

## 6. Admin dashboard (Vercel, second project)

A **separate Vercel project** pointed at the same repo. This is deliberate: the public site's bundle must never contain admin code, and separate projects make that structural rather than a matter of discipline.

1. **Add New** → **Project** → same repo → **Root Directory**: `admin-dashboard`.
2. Environment variables:

```
SESSION_SECRET=<the one you generated>
BACKEND_URL=https://api.shreeconsultancy.com
BACKEND_API_KEY=<must match backend exactly>
```

`BACKEND_API_KEY` has no `NEXT_PUBLIC_` prefix — it's server-only and never reaches the browser.

3. **Settings → Domains** → `admin.shreeconsultancy.com`.
4. Sign in at `https://admin.shreeconsultancy.com/login` with the account from step 4.7.

---

## 7. Scheduled jobs (GitHub Actions)

Both workflows already exist in `.github/workflows/`. They need two repository secrets:

**Settings → Secrets and variables → Actions → New repository secret**

| Secret | Value |
|---|---|
| `BACKEND_URL` | `https://api.shreeconsultancy.com` |
| `AUTOMATION_TOKEN` | must match the backend's exactly |

| Workflow | Schedule | What it does |
|---|---|---|
| `dunning.yml` | 03:30 UTC daily (09:00 IST) | Sends invoice reminders at 3 days before due, on the due date, and 5 days overdue |
| `tender-scraper.yml` | 20:30 UTC daily (02:00 IST) | Pulls new tenders into the Tender Inbox |

Both have `workflow_dispatch`, so you can trigger a run by hand from the Actions tab to test.

> **The scraper will find nothing until you configure it.** `automations/tender-scraper/portals.js` ships with placeholder URLs and invented CSS selectors. You need to open each real portal, inspect its listing markup, and fill in the real values. It deliberately does not attempt to get past logins or CAPTCHAs — see that folder's README.

> GitHub disables scheduled workflows on repositories with no activity for 60 days. If the jobs go quiet, check that first.

---

## 8. Post-deploy checks

Work through these in order — each depends on the ones above it:

- [ ] `curl https://api.shreeconsultancy.com/health` → `{"ok":true}`
- [ ] Public site loads at the apex domain; the theme toggle flips sun/moon and survives a refresh
- [ ] Submit the intake form → a new card appears in the dashboard's **New Leads** column
- [ ] Sign in to the dashboard; all four tabs show real data (not empty)
- [ ] Drag a pipeline card to another stage, refresh — it stayed
- [ ] Open a project → **Generate Proposal PDF** → it downloads *and* appears under **Files** (the second half needs R2)
- [ ] **Send to Client** with your own address as recipient → email arrives with the attachment
- [ ] Trigger `dunning.yml` by hand → it completes green
- [ ] Sign in as a `viewer` account → write controls are gone, tabs still readable

---

## Keeping environments in sync

The thing that breaks quietly: a secret rotated in one place and not the other.

| Value | Lives in |
|---|---|
| `BACKEND_API_KEY` | Railway **and** admin-dashboard's Vercel project |
| `AUTOMATION_TOKEN` | Railway **and** GitHub Actions secrets |
| `PUBLIC_SITE_URL` (backend) | must equal the public site's real origin, or the intake form's CORS preflight fails |
| `SESSION_SECRET` | admin-dashboard only — **changing it signs everyone out immediately** |

---

## Rough running cost

| Service | Cost |
|---|---|
| Railway (backend + Postgres) | ~$5/mo |
| Vercel × 2 | free (Hobby) |
| GitHub Actions | free |
| Cloudflare R2 | free under 10GB, no egress charges |
| Resend | free to 3,000 emails/mo |
| Domain | ~$10–15/year |

**~$5/month plus the domain**, until real traffic.

> Vercel's Hobby plan is for non-commercial use. A consultancy's own marketing site is a commercial use, so plan on Vercel Pro ($20/mo) — or host the two frontends on Railway alongside the backend, which the Dockerfile pattern already supports.

---

## What isn't set up

Deliberately out of scope so far, in rough priority order:

1. **Backups.** Railway's Postgres has its own snapshot settings — turn them on. Nothing in this repo backs the database up for you.
2. **Error tracking.** No Sentry or equivalent; failures surface in Railway/Vercel logs only.
3. **Rate limiting across instances.** Login and lead-form limits are in-memory, so they reset on restart and don't coordinate between multiple instances. Fine on one instance, worth moving to Upstash if that changes.
4. **Staging environment.** One environment only. Vercel builds every PR as a preview, but those previews point at production's backend.
