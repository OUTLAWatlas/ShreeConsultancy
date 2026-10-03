'use client';

import { useState } from 'react';
import ThemeToggle from './ThemeToggle';

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
    <div className="relative flex min-h-screen items-center justify-center bg-bg font-mono text-fg">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 px-6">
        <p className="text-sm text-fg/60">shree-consultancy / admin — sign in</p>
        <input
          required
          type="email"
          placeholder="email"
          value={credentials.email}
          onChange={(e) => setCredentials((c) => ({ ...c, email: e.target.value }))}
          className="w-full border border-fg/15 bg-transparent px-3 py-2 text-sm placeholder:text-fg/30 focus:border-accent focus:outline-none"
        />
        <input
          required
          type="password"
          placeholder="password"
          value={credentials.password}
          onChange={(e) => setCredentials((c) => ({ ...c, password: e.target.value }))}
          className="w-full border border-fg/15 bg-transparent px-3 py-2 text-sm placeholder:text-fg/30 focus:border-accent focus:outline-none"
        />
        {error && <p className="text-xs text-warn">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full border border-accent/50 px-3 py-2 text-sm text-accent hover:bg-accent/10 disabled:opacity-50"
        >
          {loading ? 'signing in…' : 'sign in'}
        </button>
      </form>
    </div>
  );
}
