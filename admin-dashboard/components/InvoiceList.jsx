'use client';

import { useState } from 'react';
import { INVOICES, formatINR } from '../lib/mockData';

const STATUS_STYLE = {
  draft: 'text-white/40 border-white/15',
  sent: 'text-cyan border-cyan/40',
  overdue: 'text-amber border-amber/50',
  paid: 'text-white/60 border-white/20',
};

export default function InvoiceList() {
  const [invoices, setInvoices] = useState(INVOICES);

  function markPaid(id) {
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, status: 'paid' } : inv)));
  }

  const totalOutstanding = invoices
    .filter((inv) => inv.status === 'sent' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs tracking-wide text-white/40">Accounts receivable</p>
        <p className="text-xs text-white/50">
          Outstanding: <span className="tabular text-white/90">{formatINR(totalOutstanding)}</span>
        </p>
      </div>

      <div className="border border-white/10">
        <div className="grid grid-cols-[1fr_180px_120px_110px_100px_90px_100px] gap-3 border-b border-white/10 px-3 py-2 text-[10px] tracking-wide text-white/30">
          <span>PROJECT</span>
          <span>CLIENT</span>
          <span>AMOUNT</span>
          <span>DUE</span>
          <span>STATUS</span>
          <span>REMINDERS</span>
          <span>ACTIONS</span>
        </div>

        {invoices.map((inv) => (
          <div
            key={inv.id}
            className="grid grid-cols-[1fr_180px_120px_110px_100px_90px_100px] gap-3 border-b border-white/5 px-3 py-2.5 text-xs last:border-b-0 hover:bg-white/[0.03]"
          >
            <span className="text-white/90">{inv.project}</span>
            <span className="text-white/50">{inv.client}</span>
            <span className="tabular text-white/60">{formatINR(inv.amount)}</span>
            <span className="tabular text-white/50">{inv.dueDate}</span>
            <span>
              <span
                className={`border px-1.5 py-0.5 text-[10px] capitalize ${STATUS_STYLE[inv.status]}`}
              >
                {inv.status}
              </span>
            </span>
            <span className="tabular text-white/40">{inv.remindersSent}</span>
            <span>
              {inv.status !== 'paid' && (
                <button
                  onClick={() => markPaid(inv.id)}
                  className="border border-white/15 px-2 py-0.5 text-white/50 hover:text-white"
                >
                  mark paid
                </button>
              )}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[10px] text-white/30">
        Reminder counts are populated by the automated dunning job (3 days before due, on due
        date, 5 days overdue) once that cron job is wired to a real email provider.
      </p>
    </div>
  );
}
