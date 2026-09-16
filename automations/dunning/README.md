# Automated Dunning (Accounts Receivable)

Standalone Node.js script. Not part of either Next.js app — run it once a
day on its own schedule.

## What it does

Pulls every unpaid invoice from the backend, and for each one checks
whether today is a reminder checkpoint: 3 days before the due date, on
the due date, or 5 days after. If so, it tells the backend to send the
reminder — the backend looks up the project's contact email and sends it
via Resend itself, then updates the reminder count and flips the invoice
to "overdue" once it's past due. This script holds no email-provider
secret at all; that lives only in `backend/.env`.

## Setup
```
npm install
cp .env.example .env   # set BACKEND_URL and AUTOMATION_TOKEN
```

`AUTOMATION_TOKEN` must match the backend service's own
`AUTOMATION_TOKEN` exactly.

## Running it
```
npm start
```

Schedule it daily, same as the tender scraper:
```
0 8 * * * cd /path/to/dunning && npm start >> dunning.log 2>&1
```