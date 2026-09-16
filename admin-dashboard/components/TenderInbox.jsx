'use client';

import { useState } from 'react';
import { TENDERS, formatINR } from '../lib/mockData';

const FILTERS = ['new', 'archived', 'converted'];

export default function TenderInbox() {
  const [tenders, setTenders] = useState(TENDERS);
  const [filter, setFilter] = useState('new');

  function setStatus(id, status) {
    setTenders((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  }

  const visible = tenders.filter((t) => t.status === filter);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs tracking-wide text-white/40">
          Scraped tenders — populated nightly by the tender-scraper job
        </p>
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs capitalize ${
                filter === f ? 'border border-cyan/50 text-cyan' : 'text-white/40 hover:text-white'
              }`}
            >
              {f} ({tenders.filter((t) => t.status === f).length})
            </button>
          ))}
        </div>
      </div>

      <div className="border border-white/10">
        <div className="grid grid-cols-[80px_1fr_140px_110px_100px_170px] gap-3 border-b border-white/10 px-3 py-2 text-[10px] tracking-wide text-white/30">
          <span>SOURCE</span>
          <span>TENDER</span>
          <span>LOCATION</span>
          <span>EST. VALUE</span>
          <span>DEADLINE</span>
          <span>ACTIONS</span>
        </div>

        {visible.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-white/30">Nothing in this view.</p>
        )}

        {visible.map((tender) => (
          <div
            key={tender.id}
            className="grid grid-cols-[80px_1fr_140px_110px_100px_170px] gap-3 border-b border-white/5 px-3 py-2.5 text-xs last:border-b-0 hover:bg-white/[0.03]"
          >
            <span className="text-white/40">{tender.source}</span>
            <span className="text-white/90">{tender.title}</span>
            <span className="text-white/50">{tender.location}</span>
            <span className="tabular text-white/60">{formatINR(tender.estValue)}</span>
            <span className="tabular text-white/50">{tender.deadline}</span>
            <span className="flex gap-2">
              {tender.status !== 'archived' && (
                <button
                  onClick={() => setStatus(tender.id, 'archived')}
                  className="border border-white/15 px-2 py-0.5 text-white/50 hover:text-white"
                >
                  archive
                </button>
              )}
              {tender.status !== 'converted' && (
                <button
                  onClick={() => setStatus(tender.id, 'converted')}
                  className="border border-cyan/40 px-2 py-0.5 text-cyan hover:bg-cyan/10"
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
