'use client';

import { useState } from 'react';

export default function LoginForm() {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Invalid credentials');
      }

      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0D0D0D] font-mono text-white">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 px-6">
        <p className="text-sm text-white/60">shree-consultancy / admin — sign in</p>
        <input
          required
          type="email"
          placeholder="email"
          value={credentials.email}
          onChange={(e) => setCredentials((c) => ({ ...c, email: e.target.value }))}
          className="w-full border border-white/15 bg-transparent px-3 py-2 text-sm placeholder:text-white/30 focus:border-[#00E5FF] focus:outline-none"
        />
        <input
          required
          type="password"
          placeholder="password"
          value={credentials.password}
          onChange={(e) => setCredentials((c) => ({ ...c, password: e.target.value }))}
          className="w-full border border-white/15 bg-transparent px-3 py-2 text-sm placeholder:text-white/30 focus:border-[#00E5FF] focus:outline-none"
        />
        {error && <p className="text-xs text-[#FF7B00]">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full border border-[#00E5FF]/50 px-3 py-2 text-sm text-[#00E5FF] hover:bg-[#00E5FF]/10 disabled:opacity-50"
        >
          {loading ? 'signing in…' : 'sign in'}
        </button>
      </form>
    </div>
  );
}
