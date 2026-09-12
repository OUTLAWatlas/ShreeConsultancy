'use client';

const STAGES = ['New Leads', 'Quoting', 'Drafting', 'Client Review', 'Invoicing', 'Closed'];

// Placeholder pipeline data. Replace with a real fetch to your
// Projects API once the backend exists.
const MOCK_CARDS = [
  { id: 1, stage: 'New Leads', title: 'Switchyard — Nagpur', value: '₹4.2L' },
  { id: 2, stage: 'Quoting', title: '33kV Substation — Pune', value: '₹6.8L' },
  { id: 3, stage: 'Drafting', title: 'GIS Sub-station — Surat', value: '₹9.1L' },
  { id: 4, stage: 'Invoicing', title: 'Cement Plant — Satna', value: '₹5.5L' },
];

export default function PipelineBoard({ email }) {
  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] font-mono text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <p className="text-xs tracking-wide text-white/40">
          shree-consultancy / admin{email ? ` — ${email}` : ''}
        </p>
        <button onClick={handleLogout} className="text-xs text-white/50 hover:text-white">
          sign out
        </button>
      </div>

      <div className="overflow-x-auto p-6">
        <div className="flex gap-4">
          {STAGES.map((stage) => (
            <div key={stage} className="w-64 shrink-0">
              <p className="mb-3 text-xs tracking-wide text-white/40">{stage}</p>
              <div className="space-y-2">
                {MOCK_CARDS.filter((c) => c.stage === stage).map((card) => (
                  <div key={card.id} className="border border-white/10 bg-[#141414] p-3 text-xs">
                    <p className="text-white/90">{card.title}</p>
                    <p className="mt-1 text-white/40">{card.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
