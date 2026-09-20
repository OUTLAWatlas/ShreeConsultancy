'use client';

import { useState } from 'react';
import { STAGES } from '../lib/mockData';

const DISCIPLINES = ['Electrical', 'Civil', 'Structural'];

export default function NewProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '',
    client: '',
    discipline: DISCIPLINES[0],
    value: '',
    stage: STAGES[0],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.title || !form.client || !form.value) {
      setError('Title, client and value are required.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, value: Number(form.value) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not create the project.');
      onCreated(data.project);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm space-y-3 border border-white/10 bg-ink p-6 text-sm"
      >
        <div className="mb-1 flex items-center justify-between">
          <p className="text-xs tracking-wide text-white/40">New project</p>
          <button type="button" onClick={onClose} className="text-xs text-white/40 hover:text-white">
            close
          </button>
        </div>

        <input
          required
          placeholder="title"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          className="w-full border border-white/15 bg-transparent px-2 py-1.5 text-xs placeholder:text-white/30 focus:border-cyan focus:outline-none"
        />
        <input
          required
          placeholder="client"
          value={form.client}
          onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))}
          className="w-full border border-white/15 bg-transparent px-2 py-1.5 text-xs placeholder:text-white/30 focus:border-cyan focus:outline-none"
        />

        <div className="flex gap-2">
          <select
            value={form.discipline}
            onChange={(e) => setForm((f) => ({ ...f, discipline: e.target.value }))}
            className="flex-1 border border-white/15 bg-ink px-2 py-1.5 text-xs text-white/80 focus:border-cyan focus:outline-none"
          >
            {DISCIPLINES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <input
            required
            placeholder="₹ value"
            inputMode="numeric"
            value={form.value}
            onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
            className="w-28 border border-white/15 bg-transparent px-2 py-1.5 text-xs placeholder:text-white/30 focus:border-cyan focus:outline-none"
          />
        </div>

        <select
          value={form.stage}
          onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value }))}
          className="w-full border border-white/15 bg-ink px-2 py-1.5 text-xs text-white/80 focus:border-cyan focus:outline-none"
        >
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {error && <p className="text-xs text-amber">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full border border-cyan/50 px-2 py-2 text-xs text-cyan hover:bg-cyan/10 disabled:opacity-50"
        >
          {saving ? 'creating…' : 'create project'}
        </button>
      </form>
    </div>
  );
}