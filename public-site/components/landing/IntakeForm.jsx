'use client';

import { useState } from 'react';

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

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
    // TODO: wire to a real endpoint, e.g. POST /api/leads, once the backend exists.
  }

  return (
    <section id="contact" className="mx-auto max-w-3xl px-6 py-28 lg:px-10">
      <div className="rounded-sm border border-[#00E5FF]/30 bg-black font-mono text-sm text-[#00E5FF]/90 shadow-[0_0_60px_-15px_rgba(0,229,255,0.25)]">
        <div className="flex items-center gap-2 border-b border-[#00E5FF]/20 px-4 py-3 text-white/40">
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="ml-2 text-xs">intake — project brief</span>
        </div>

        <div className="p-6 sm:p-8">
          {submitted ? (
            <p>
              <span className="text-[#FF7B00]">$</span> brief received. we&apos;ll reply to{' '}
              {form.email || 'your inbox'} within one business day.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {step === 0 && (
                <div>
                  <p className="mb-4">
                    <span className="text-[#FF7B00]">$</span> select project type
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {PROJECT_TYPES.map((type) => (
                      <button
                        type="button"
                        key={type}
                        onClick={() => setForm((f) => ({ ...f, type }))}
                        className={`rounded-sm border px-3 py-2 text-left text-xs transition-colors ${
                          form.type === type
                            ? 'border-[#00E5FF] bg-[#00E5FF]/10 text-white'
                            : 'border-white/15 text-white/60 hover:border-white/30'
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
                      <span className="text-[#FF7B00]">$</span> estimated budget — ₹
                      {Number(form.budget).toLocaleString('en-IN')}
                    </p>
                    <input
                      type="range"
                      min={100000}
                      max={10000000}
                      step={50000}
                      value={form.budget}
                      onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                      className="w-full accent-[#00E5FF]"
                    />
                  </div>
                  <div>
                    <p className="mb-2">
                      <span className="text-[#FF7B00]">$</span> site scale —{' '}
                      {Number(form.sqft).toLocaleString('en-IN')} sq. ft
                    </p>
                    <input
                      type="range"
                      min={500}
                      max={200000}
                      step={500}
                      value={form.sqft}
                      onChange={(e) => setForm((f) => ({ ...f, sqft: e.target.value }))}
                      className="w-full accent-[#FF7B00]"
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
                    className="rounded-sm border border-white/15 bg-transparent px-3 py-2 text-white placeholder:text-white/30 focus:border-[#00E5FF] focus:outline-none"
                  />
                  <input
                    required
                    type="email"
                    placeholder="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="rounded-sm border border-white/15 bg-transparent px-3 py-2 text-white placeholder:text-white/30 focus:border-[#00E5FF] focus:outline-none"
                  />
                  <input
                    placeholder="company"
                    value={form.company}
                    onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                    className="rounded-sm border border-white/15 bg-transparent px-3 py-2 text-white placeholder:text-white/30 focus:border-[#00E5FF] focus:outline-none sm:col-span-2"
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={back}
                  disabled={step === 0}
                  className="text-xs text-white/40 disabled:opacity-0"
                >
                  ← back
                </button>
                {step < STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={next}
                    disabled={step === 0 && !form.type}
                    className="rounded-sm border border-[#00E5FF]/50 px-4 py-2 text-xs text-[#00E5FF] disabled:opacity-30"
                  >
                    continue →
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="rounded-sm border border-[#FF7B00]/60 px-4 py-2 text-xs text-[#FF7B00]"
                  >
                    send brief
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
