// Standalone tender scraper — run on a nightly cron (e.g. 2:00 AM), not
// part of either Next.js app. Visits each portal in portals.js, pulls
// out plain-text listings, and pushes them to the backend service's
// token-protected automation API, which upserts by externalId so
// re-running this never creates duplicates.
//
// SCOPE, ON PURPOSE: this only reads plain public listing pages. It does
// not attempt to solve CAPTCHAs, log into a portal, replay session
// cookies, or otherwise get past access controls a site has put up —
// that crosses from "reading a public page" into "circumventing a
// website's access controls," which is a different (and legally murkier)
// thing to automate, regardless of the original design note about it.
// If a portal you need requires a login or shows a CAPTCHA, the practical
// options are: check whether it publishes an official API or data feed,
// or add those listings to the Tender Inbox by hand.
import 'dotenv/config';
import { chromium } from 'playwright';
import { PORTALS } from './portals.js';

const BACKEND_URL = process.env.BACKEND_URL;
const AUTOMATION_TOKEN = process.env.AUTOMATION_TOKEN;

if (!BACKEND_URL || !AUTOMATION_TOKEN) {
  console.error('Set BACKEND_URL and AUTOMATION_TOKEN in .env before running.');
  process.exit(1);
}

async function scrapePortal(browser, portal) {
  const page = await browser.newPage();
  const found = [];

  try {
    await page.goto(portal.listUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const rows = await page.$$(portal.rowSelector);
    for (const row of rows) {
      const title = await textOf(row, portal.fields.title);
      const location = await textOf(row, portal.fields.location);
      const estValueRaw = await textOf(row, portal.fields.estValue);
      const deadlineRaw = await textOf(row, portal.fields.deadline);
      const externalId = await row.getAttribute(portal.fields.externalId.attr);

      if (!title || !externalId) continue; // skip anything we can't dedup

      found.push({
        source: portal.source,
        title: title.trim(),
        location: (location || '').trim(),
        estValue: parseCurrency(estValueRaw),
        deadline: parseDate(deadlineRaw),
        externalId: `${portal.source}:${externalId}`,
      });
    }
  } catch (err) {
    console.error(`[${portal.source}] failed to scrape:`, err.message);
  } finally {
    await page.close();
  }

  return found;
}

async function textOf(row, selector) {
  const el = await row.$(selector);
  return el ? el.innerText() : '';
}

function parseCurrency(raw) {
  if (!raw) return 0;
  const digits = raw.replace(/[^0-9]/g, '');
  return digits ? Number(digits) : 0;
}

function parseDate(raw) {
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed.toISOString();
}

async function pushTender(tender) {
  const res = await fetch(`${BACKEND_URL}/automation/tenders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-automation-token': AUTOMATION_TOKEN,
    },
    body: JSON.stringify(tender),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API rejected tender "${tender.title}": ${res.status} ${body}`);
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  let totalFound = 0;
  let totalFailed = 0;

  for (const portal of PORTALS) {
    const tenders = await scrapePortal(browser, portal);
    console.log(`[${portal.source}] found ${tenders.length} listing(s)`);

    for (const tender of tenders) {
      try {
        await pushTender(tender);
        totalFound += 1;
      } catch (err) {
        totalFailed += 1;
        console.error(err.message);
      }
    }
  }

  await browser.close();
  console.log(`Done. Pushed ${totalFound} tender(s), ${totalFailed} failure(s).`);
}

main().catch((err) => {
  console.error('Scraper run failed:', err);
  process.exit(1);
});