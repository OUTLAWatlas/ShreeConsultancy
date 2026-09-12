# Shree Consultancy — Public Site

The marketing landing page. Deploy this to `shreeconsultancy.com`.

This app contains **zero admin code** — no dashboard component, no auth
logic, nothing. The triple-click-logo easter egg just navigates the browser
to `NEXT_PUBLIC_ADMIN_URL`, a completely separate deployment. There's nothing
for anyone to find in this app's JS bundle even if they go looking.

## Setup
```
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_ADMIN_URL for local dev
npm run dev
```

## Content notes
- Team section leads with Suhas Patil (Founder & Principal), followed by the
  three discipline leads — Electrical, Civil, Structural — matching the real
  org chart. No "solo" or freelancer framing anywhere.
- "Global Reach" section (the scroll-linked wireframe globe) plots the real
  countries the firm has delivered projects in.
- Portfolio and services content is pulled from `data/projects.js` and the
  services list in `components/landing/ServicesBento.jsx`, sourced from the
  real project history and company profile.

## Deploying
Any Next.js host works (Vercel, etc.). Point `shreeconsultancy.com` at this
deployment and set `NEXT_PUBLIC_ADMIN_URL=https://admin.shreeconsultancy.com`
in the host's environment settings.
