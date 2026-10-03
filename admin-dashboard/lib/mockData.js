// Display constants only.
//
// This file used to also export PROJECTS / TENDERS / INVOICES / TEAM
// arrays — the migration seam from the frontend-only prototype. All four
// are gone now that every tab reads from Postgres through the backend
// service; what's left is the stage vocabulary and a currency formatter,
// which are presentation concerns and belong on the client.

export const STAGES = ['New Leads', 'Quoting', 'Drafting', 'Client Review', 'Invoicing', 'Closed'];

export function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
