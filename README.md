# Shree Consultancy — Two-App Structure

This repo is split into two independent Next.js apps, matching Option A from
our earlier discussion: the public marketing site and the admin dashboard
are entirely separate deployments, sharing no code or bundle.

```
shree-consultancy/
  public-site/       → deploy to shreeconsultancy.com
  admin-dashboard/    → deploy to admin.shreeconsultancy.com
```

## Why two apps instead of one
The public site's JS bundle now contains **no admin code whatsoever** — not
even lazily loaded. Someone inspecting the public site's network requests or
source maps has nothing to find. The only connection between the two is a
single redirect: triple-clicking the logo on the public site sends the
browser to the admin subdomain.

## Local development
Run both at once, on different ports:
```
cd public-site && npm install && npm run dev        # localhost:3000
cd admin-dashboard && npm install && npm run dev     # localhost:3001
```
Set `public-site/.env.local`'s `NEXT_PUBLIC_ADMIN_URL=http://localhost:3001`
for local testing so the redirect points at your local admin server instead
of production.

## Deployment
Each folder deploys as its own project:
- **public-site** → `shreeconsultancy.com`
- **admin-dashboard** → `admin.shreeconsultancy.com`

On Vercel, that's two separate projects pointed at the same repo (set each
project's "Root Directory" to `public-site` or `admin-dashboard`). Any other
Next.js-capable host works the same way — the point is two independent
builds and two independent deploys, not one app serving two hostnames.

DNS: add a `CNAME` (or `A`, depending on your host) for the `admin`
subdomain pointing at wherever `admin-dashboard` is hosted. Most hosts
issue SSL for the subdomain automatically once it's added in project
settings.

## Session isolation
The admin session cookie is set without a `domain` attribute in
`admin-dashboard/app/api/auth/login/route.js`, which scopes it to
`admin.shreeconsultancy.com` only. The public site can never read or send
that cookie, even accidentally — there's no shared-domain cookie to leak.

See each app's own README for setup details specific to that app, and
`admin-dashboard/README.md` in particular for what still needs to be wired
up (real credential verification) before this handles real client data.
