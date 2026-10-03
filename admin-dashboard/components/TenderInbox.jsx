'use client';

import { useState } from 'react';
import { formatINR } from '../lib/mockData';
import { useCanWrite } from './RoleContext';

const FILTERS = ['new', 'archived', 'converted'];

export default function TenderInbox({ initialTenders = [] }) {
  const canWrite = useCanWrite();
  const [tenders, setTenders] = useState(() =>
    initialTenders.map((t) => ({ ...t, deadline: String(t.deadline).slice(0, 10) }))
  );
  const [filter, setFilter] = useState('new');
  const [error, setError] = useState('');

  async function archive(id) {
    const previous = tenders;
    setTenders((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'archived' } : t)));
    try {
      const res = await fetch(`/api/tenders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' }),
      });
      if (!res.ok) throw new Error();
      setError('');
    } catch {
      setTenders(previous); // roll back rather than showing a lie
      setError('That didn’t save — check your connection and try again.');
    }
  }

  // Convert does more than relabel: the backend also creates a matching
  // project in New Leads, in one transaction.
  async function convert(id) {
    const previous = tenders;
    setTenders((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'converted' } : t)));
    try {
      const res = await fetch(`/api/tenders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'convert' }),
      });
      if (!res.ok) throw new Error();
      setError('');
    } catch {
      setTenders(previous);
      setError('Conversion didn’t save — check your connection and try again.');
    }
  }

  const visible = tenders.filter((t) => t.status === filter);

  return (
    <div>
      {error && <p className="mb-4 text-xs text-warn">{error}</p>}

      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs tracking-wide text-fg/40">
          Scraped tenders — populated nightly by the tender-scraper job
        </p>
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs capitalize ${
                filter === f ? 'border border-accent/50 text-accent' : 'text-fg/40 hover:text-fg'
              }`}
            >
              {f} ({tenders.filter((t) => t.status === f).length})
            </button>
          ))}
        </div>
      </div>

      <div className="border border-fg/10">
        <div className="grid grid-cols-[80px_1fr_140px_110px_100px_170px] gap-3 border-b border-fg/10 px-3 py-2 text-[10px] tracking-wide text-fg/30">
          <span>SOURCE</span>
          <span>TENDER</span>
          <span>LOCATION</span>
          <span>EST. VALUE</span>
          <span>DEADLINE</span>
          <span>{canWrite ? 'ACTIONS' : ''}</span>
        </div>

        {visible.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-fg/30">Nothing in this view.</p>
        )}

        {visible.map((tender) => (
          <div
            key={tender.id}
            className="grid grid-cols-[80px_1fr_140px_110px_100px_170px] gap-3 border-b border-fg/5 px-3 py-2.5 text-xs last:border-b-0 hover:bg-fg/[0.03]"
          >
            <span className="text-fg/40">{tender.source}</span>
            <span className="text-fg/90">{tender.title}</span>
            <span className="text-fg/50">{tender.location}</span>
            <span className="tabular text-fg/60">{formatINR(tender.estValue)}</span>
            <span className="tabular text-fg/50">{tender.deadline}</span>
            <span className="flex gap-2">
              {canWrite && tender.status !== 'archived' && (
                <button
                  onClick={() => archive(tender.id)}
                  className="border border-fg/15 px-2 py-0.5 text-fg/50 hover:text-fg"
                >
                  archive
                </button>
              )}
              {canWrite && tender.status !== 'converted' && (
                <button
                  onClick={() => convert(tender.id)}
                  className="border border-accent/40 px-2 py-0.5 text-accent hover:bg-accent/10"
                >
                  convert
                </button>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
