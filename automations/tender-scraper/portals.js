// One entry per portal this scraper knows how to read. Each entry is a
// plain public listing page plus CSS selectors for pulling the fields
// out of it — there is deliberately no login handling, no CAPTCHA
// solving, and no session-cookie juggling here (see README.md for why).
//
// These selectors are placeholders. Government/corporate e-procurement
// portals change their markup often and vary a lot from each other —
// inspect the real page in a browser and update the selectors here
// before running this against a live site.
export const PORTALS = [
  {
    source: 'MahaTenders',
    listUrl: 'https://example-mahatenders-portal.invalid/tenders/electrical',
    rowSelector: '.tender-row',
    fields: {
      title: '.tender-title',
      location: '.tender-location',
      estValue: '.tender-value',
      deadline: '.tender-deadline',
      // A stable per-row identifier for dedup — usually a data attribute
      // or the row's own link href. Update to whatever the real portal
      // actually exposes.
      externalId: { attr: 'data-tender-id' },
    },
  },
  {
    source: 'GeM',
    listUrl: 'https://example-gem-portal.invalid/search?category=electrical-works',
    rowSelector: '.bid-list-item',
    fields: {
      title: '.bid-title',
      location: '.bid-location',
      estValue: '.bid-value',
      deadline: '.bid-closing-date',
      externalId: { attr: 'data-bid-id' },
    },
  },
];