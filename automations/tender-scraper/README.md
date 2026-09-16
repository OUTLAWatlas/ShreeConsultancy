# Tender Scraper

Standalone Node.js + Playwright script. Not part of either Next.js app —
it's meant to run on its own schedule (e.g. a nightly cron job at 2:00 AM)
and push what it finds into the admin dashboard's database via API.

## Scope, on purpose

This reads **plain public listing pages only**. It does not solve
CAPTCHAs, log into a portal, or replay session cookies to get past access
controls. Reading a public page is one thing; getting around a site's
access controls is a different one, and this script stays on the "reading
a public page" side of that line regardless of what a given portal's
terms of service do or don't say. If a tender source you need requires a
login or shows a CAPTCHA:
- check whether it publishes an official API, RSS feed, or data export
  (many government portals do, even if it's not obvious from the search
  UI), or
- add those listings to the Tender Inbox by hand — it takes seconds and
  doesn't need this script to know how.

## Setup
```
npm install
npx playwright install chromium   # downloads the browser binary
cp .env.example .env              # set BACKEND_URL and AUTOMATION_TOKEN
```

`AUTOMATION_TOKEN` must be the exact same value as `AUTOMATION_TOKEN` in
the backend service's own environment — that's how this script
authenticates to `/automation/tenders` without a browser session.

## Configuring portals

`portals.js` lists each source this script knows how to read, with CSS
selectors for pulling title/location/value/deadline/id out of each
listing row. **These selectors are placeholders** — go inspect the real
portal page in a browser's dev tools and fill in the actual selectors
before running this for real. Portal markup also changes over time, so
expect to revisit this file when a source stops returning results.

## Running it
```
npm start
```

Wire this into a schedule with a plain crontab entry:
```
0 2 * * * cd /path/to/tender-scraper && npm start >> scraper.log 2>&1
```
or a GitHub Actions scheduled workflow, or your host's own cron/queue
system — whatever you're already using for other jobs.

## Dedup

Each pushed tender includes an `externalId` (`<source>:<row id>`). The
backend upserts on that field, so re-running this script — including
re-running it after a crash partway through — never creates duplicate
tenders.