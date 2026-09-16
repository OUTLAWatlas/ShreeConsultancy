'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/dashboard', label: 'Pipeline' },
  { href: '/tenders', label: 'Tender Inbox' },
  { href: '/invoices', label: 'Invoices' },
  { href: '/team', label: 'Team' },
];

export default function AppShell({ email, children }) {
  const pathname = usePathname();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  return (
    <div className="min-h-screen bg-ink text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-6">
          <p className="text-xs tracking-wide text-white/40">
            shree-consultancy / admin{email ? ` — ${email}` : ''}
          </p>
          <nav className="flex gap-1">
            {TABS.map((tab) => {
              const active = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`px-3 py-1.5 text-xs ${
                    active
                      ? 'border border-cyan/50 text-cyan'
                      : 'border border-transparent text-white/50 hover:text-white'
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <button onClick={handleLogout} className="text-xs text-white/50 hover:text-white">
          sign out
        </button>
      </div>

      <div className="p-6">{children}</div>
    </div>
  );
}
