'use client';

import { useEffect, useState } from 'react';
import { useTripleClickLogo } from '../../hooks/useTripleClickLogo';

// Set NEXT_PUBLIC_ADMIN_URL in .env.local / your host's env settings.
// Falls back to the production subdomain if unset.
const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.shreeconsultancy.com';

const LINKS = [
  { href: '#services', label: 'Services' },
  { href: '#team', label: 'Team' },
  { href: '#work', label: 'Work' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  // Three clicks on the logo, in quick succession, send you to the admin
  // subdomain — a separate app entirely, not something bundled into this
  // site. No visible "Admin" or "Login" affordance on the public page.
  const handleLogoClick = useTripleClickLogo(() => {
    window.location.href = ADMIN_URL;
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ${
        scrolled
          ? 'border-b border-white/5 bg-[#050505]/70 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <button
          type="button"
          onClick={handleLogoClick}
          aria-label="Shree Consultancy"
          className="group flex select-none items-center gap-3"
        >
          <span className="relative flex h-9 w-9 items-center justify-center rounded-sm border border-[#00E5FF]/40 [transform-style:preserve-3d] transition-transform duration-700 group-hover:[transform:rotateY(180deg)]">
            <span className="absolute inset-0 flex items-center justify-center font-mono text-sm text-[#00E5FF] [backface-visibility:hidden]">
              SC
            </span>
            <span className="absolute inset-0 flex items-center justify-center font-mono text-sm text-[#FF7B00] [backface-visibility:hidden] [transform:rotateY(180deg)]">
              ⚡
            </span>
          </span>
          <span className="font-display text-[15px] tracking-tight text-white">
            Shree Consultancy
          </span>
        </button>

        <ul className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm text-white/70 transition-colors hover:text-white"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href="#contact"
          className="rounded-sm border border-[#00E5FF]/50 px-4 py-2 text-sm text-[#00E5FF] transition-colors hover:bg-[#00E5FF]/10"
        >
          Start a project
        </a>
      </nav>
    </header>
  );
}
