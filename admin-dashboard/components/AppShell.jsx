'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

const TABS = [
  { href: '/dashboard', label: 'Pipeline' },
  { href: '/tenders', label: 'Tender Inbox' },
  { href: '/invoices', label: 'Invoices' },
  { href: '/team', label: 'Team' },
];

export default function AppShell({ email, role, children }) {
  const pathname = usePathname();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="flex items-center justify-between border-b border-fg/10 px-6 py-4">
        <div className="flex items-center gap-6">
          <p className="text-xs tracking-wide text-fg/40">
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
                      ? 'border border-accent/50 text-accent'
                      : 'border border-transparent text-fg/50 hover:text-fg'
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* Viewers can read every tab but every write control is hidden
              from them, so say why rather than leaving them hunting for
              buttons that aren't there. */}
          {role === 'viewer' && (
            <span className="border border-fg/15 px-2 py-0.5 text-[10px] text-fg/40">read-only</span>
          )}
          <ThemeToggle />
          <button onClick={handleLogout} className="text-xs text-fg/50 hover:text-fg">
            sign out
          </button>
        </div>
      </div>

      <div className="p-6">{children}</div>
    </div>
  );
}
