// Standalone accounts-receivable dunning job — run once a day (e.g. via
// cron), not part of either Next.js app. Pulls every unpaid invoice from
// the backend, decides which ones hit a reminder checkpoint today (3
// days before due, on the due date, 5 days after), and tells the backend
// to send the reminder — which it now does itself via Resend, so this
// script holds no email-provider secret at all.
import 'dotenv/config';

const BACKEND_URL = process.env.BACKEND_URL;
const AUTOMATION_TOKEN = process.env.AUTOMATION_TOKEN;

if (!BACKEND_URL || !AUTOMATION_TOKEN) {
  console.error('Set BACKEND_URL and AUTOMATION_TOKEN in .env before running.');
  process.exit(1);
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Days-from-due-date at which a reminder should go out. Negative means
// "before the due date."
const CHECKPOINTS = [-3, 0, 5];

async function fetchUnpaidInvoices() {
  const res = await fetch(`${BACKEND_URL}/automation/invoices`, {
    headers: { 'x-automation-token': AUTOMATION_TOKEN },
  });
  if (!res.ok) throw new Error(`Failed to fetch invoices: ${res.status}`);
  const { invoices } = await res.json();
  return invoices;
}

// This is also where the actual reminder email gets sent — the backend
// looks up the project's contact email and calls Resend itself.
async function sendReminder(invoiceId) {
  const res = await fetch(`${BACKEND_URL}/automation/invoices/${invoiceId}/remind`, {
    method: 'POST',
    headers: { 'x-automation-token': AUTOMATION_TOKEN },
  });
  if (!res.ok) throw new Error(`Failed to send reminder for invoice ${invoiceId}: ${res.status}`);
}

function daysUntilDue(dueDate) {
  const due = new Date(dueDate);
  const today = new Date();
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.round((due - today) / MS_PER_DAY);
}

function isCheckpointToday(invoice) {
  return CHECKPOINTS.includes(daysUntilDue(invoice.dueDate));
}

async function main() {
  const invoices = await fetchUnpaidInvoices();
  let sent = 0;

  for (const invoice of invoices) {
    if (!isCheckpointToday(invoice)) continue;

    try {
      await sendReminder(invoice.id);
      sent += 1;
    } catch (err) {
      console.error(`Failed to process invoice ${invoice.id}:`, err.message);
    }
  }

  console.log(`Done. Triggered ${sent} reminder(s) out of ${invoices.length} unpaid invoice(s).`);
}

main().catch((err) => {
  console.error('Dunning run failed:', err);
  process.exit(1);
});