'use client';

import { useState } from 'react';

// The backend service's URL. The form posts leads straight there —
// cross-origin, CORS-scoped to this site's origin on the backend side —
// without going through admin-dashboard at all.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const STEPS = ['project', 'scale', 'contact'];

const PROJECT_TYPES = [
  'Switchyard / Substation',
  'Industrial Plant',
  'Renewable / Solar',
  'Water & Utility',
  'Other',
];

export default function IntakeForm() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    type: '',
    budget: 500000,
    sqft: 5000,
    name: '',
    email: '',
    company: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSending(true);

    try {
      const res = await fetch(`${API_URL}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again in a moment.');
      setSubmitted(true);
    } catch (err) {
      // Never show the success screen on a failure — a lead that silently
      // vanished is worse than an error the visitor can act on.
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <section id="contact" className="mx-auto max-w-3xl px-6 py-28 lg:px-10">
      <div className="rounded-sm border border-accent/30 bg-surface font-mono text-sm text-accent/90 shadow-glow-sm">
        <div className="flex items-center gap-2 border-b border-accent/20 px-4 py-3 text-fg/40">
          <span className="h-2.5 w-2.5 rounded-full bg-fg/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-fg/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-fg/20" />
          <span className="ml-2 text-xs">intake — project brief</span>
        </div>

        <div className="p-6 sm:p-8">
          {submitted ? (
            <p>
              <span className="text-warn">$</span> brief received. we&apos;ll reply to{' '}
              {form.email || 'your inbox'} within one business day.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {step === 0 && (
                <div>
                  <p className="mb-4">
                    <span className="text-warn">$</span> select project type
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {PROJECT_TYPES.map((type) => (
                      <button
                        type="button"
                        key={type}
                        onClick={() => setForm((f) => ({ ...f, type }))}
                        className={`rounded-sm border px-3 py-2 text-left text-xs transition-colors ${
                          form.type === type
                            ? 'border-accent bg-accent/10 text-fg'
                            : 'border-fg/15 text-fg/60 hover:border-fg/30'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <p className="mb-2">
                      <span className="text-warn">$</span> estimated budget — ₹
                      {Number(form.budget).toLocaleString('en-IN')}
                    </p>
                    <input
                      type="range"
                      min={100000}
                      max={10000000}
                      step={50000}
                      value={form.budget}
                      onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                      className="w-full accent-accent"
                    />
                  </div>
                  <div>
                    <p className="mb-2">
                      <span className="text-warn">$</span> site scale —{' '}
                      {Number(form.sqft).toLocaleString('en-IN')} sq. ft
                    </p>
                    <input
                      type="range"
                      min={500}
                      max={200000}
                      step={500}
                      value={form.sqft}
                      onChange={(e) => setForm((f) => ({ ...f, sqft: e.target.value }))}
                      className="w-full accent-warn"
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <input
                    required
                    placeholder="name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="rounded-sm border border-fg/15 bg-transparent px-3 py-2 text-fg placeholder:text-fg/30 focus:border-accent focus:outline-none"
                  />
                  <input
                    required
                    type="email"
                    placeholder="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="rounded-sm border border-fg/15 bg-transparent px-3 py-2 text-fg placeholder:text-fg/30 focus:border-accent focus:outline-none"
                  />
                  <input
                    placeholder="company"
                    value={form.company}
                    onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                    className="rounded-sm border border-fg/15 bg-transparent px-3 py-2 text-fg placeholder:text-fg/30 focus:border-accent focus:outline-none sm:col-span-2"
                  />
                </div>
              )}

              {error && <p className="text-xs text-warn">{error}</p>}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={back}
                  disabled={step === 0}
                  className="text-xs text-fg/40 disabled:opacity-0"
                >
                  ← back
                </button>
                {step < STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={next}
                    disabled={step === 0 && !form.type}
                    className="rounded-sm border border-accent/50 px-4 py-2 text-xs text-accent disabled:opacity-30"
                  >
                    continue →
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={sending}
                    className="rounded-sm border border-warn/60 px-4 py-2 text-xs text-warn disabled:opacity-50"
                  >
                    {sending ? 'sending…' : 'send brief'}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
