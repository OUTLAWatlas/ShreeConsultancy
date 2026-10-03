'use client';

import { useState } from 'react';
import { formatINR } from '../lib/mockData';
import { useCanWrite } from './RoleContext';

const STATUS_STYLE = {
  draft: 'text-fg/40 border-fg/15',
  sent: 'text-accent border-accent/40',
  overdue: 'text-warn border-warn/50',
  paid: 'text-fg/60 border-fg/20',
};

// Prisma returns the joined project; flatten it to what the table renders.
function toRow(inv) {
  return {
    id: inv.id,
    project: inv.project?.title ?? '—',
    client: inv.project?.client ?? '—',
    amount: inv.amount,
    status: inv.status,
    dueDate: String(inv.dueDate).slice(0, 10),
    remindersSent: inv.remindersSent,
  };
}

export default function InvoiceList({ initialInvoices = [] }) {
  const canWrite = useCanWrite();
  const [invoices, setInvoices] = useState(() => initialInvoices.map(toRow));
  const [error, setError] = useState('');

  async function markPaid(id) {
    const previous = invoices;
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, status: 'paid' } : inv)));
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid' }),
      });
      if (!res.ok) throw new Error();
      setError('');
    } catch {
      setInvoices(previous);
      setError('That didn’t save — check your connection and try again.');
    }
  }

  const totalOutstanding = invoices
    .filter((inv) => inv.status === 'sent' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div>
      {error && <p className="mb-4 text-xs text-warn">{error}</p>}

      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs tracking-wide text-fg/40">Accounts receivable</p>
        <p className="text-xs text-fg/50">
          Outstanding: <span className="tabular text-fg/90">{formatINR(totalOutstanding)}</span>
        </p>
      </div>

      {invoices.length === 0 ? (
        <p className="border border-fg/10 px-3 py-6 text-center text-xs text-fg/30">
          No invoices yet — generate one from a project&apos;s Document Engine on the Pipeline tab.
        </p>
      ) : (
        <div className="border border-fg/10">
          <div className="grid grid-cols-[1fr_180px_120px_110px_100px_90px_100px] gap-3 border-b border-fg/10 px-3 py-2 text-[10px] tracking-wide text-fg/30">
            <span>PROJECT</span>
            <span>CLIENT</span>
            <span>AMOUNT</span>
            <span>DUE</span>
            <span>STATUS</span>
            <span>REMINDERS</span>
            <span>{canWrite ? 'ACTIONS' : ''}</span>
          </div>

          {invoices.map((inv) => (
            <div
              key={inv.id}
              className="grid grid-cols-[1fr_180px_120px_110px_100px_90px_100px] gap-3 border-b border-fg/5 px-3 py-2.5 text-xs last:border-b-0 hover:bg-fg/[0.03]"
            >
              <span className="text-fg/90">{inv.project}</span>
              <span className="text-fg/50">{inv.client}</span>
              <span className="tabular text-fg/60">{formatINR(inv.amount)}</span>
              <span className="tabular text-fg/50">{inv.dueDate}</span>
              <span>
                <span
                  className={`border px-1.5 py-0.5 text-[10px] capitalize ${STATUS_STYLE[inv.status] || STATUS_STYLE.draft}`}
                >
                  {inv.status}
                </span>
              </span>
              <span className="tabular text-fg/40">{inv.remindersSent}</span>
              <span>
                {canWrite && inv.status !== 'paid' && (
                  <button
                    onClick={() => markPaid(inv.id)}
                    className="border border-fg/15 px-2 py-0.5 text-fg/50 hover:text-fg"
                  >
                    mark paid
                  </button>
                )}
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="mt-3 text-[10px] text-fg/30">
        Reminder counts are populated by the automated dunning job (3 days before due, on the due
        date, 5 days overdue).
      </p>
    </div>
  );
}
