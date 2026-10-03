'use client';

import { useEffect, useState } from 'react';
import { applyTheme, readStoredTheme, DEFAULT_THEME } from '../lib/theme';

// Sun ⇄ moon switch.
//
// The icon is one circle that morphs: a mask circle slides over it to bite
// out a crescent, while the rays retract and spin. Doing it with a mask
// rather than swapping two icons means the shape moves continuously
// instead of popping.
export default function ThemeToggle({ className = '' }) {
  // Render the light icon on the server, then correct on mount. The actual
  // page colours are already right before first paint (THEME_INIT_SCRIPT);
  // this is only about which glyph to show, and reading localStorage during
  // render would desync server and client HTML.
  const [theme, setTheme] = useState(DEFAULT_THEME === 'system' ? 'light' : DEFAULT_THEME);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const current =
      readStoredTheme() || document.documentElement.getAttribute('data-theme') || 'light';
    setTheme(current);
    setMounted(true);
  }, []);

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
  }

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`inline-flex h-7 w-7 items-center justify-center border border-fg/15 text-fg/50 transition-colors hover:border-accent/50 hover:text-accent ${className}`}
      // Until mounted we don't know the real theme, so keep the glyph
      // invisible for that one frame rather than flashing the wrong one.
      style={{ opacity: mounted ? 1 : 0 }}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <defs>
          <mask id="theme-toggle-crescent">
            <rect width="24" height="24" fill="white" />
            {/* Slid off-canvas in light mode, over the disc in dark mode. */}
            <circle
              cx={isDark ? 16 : 26}
              cy={isDark ? 8 : 0}
              r="7"
              fill="black"
              style={{ transition: 'cx 400ms cubic-bezier(.4,0,.2,1), cy 400ms cubic-bezier(.4,0,.2,1)' }}
            />
          </mask>
        </defs>

        <circle
          cx="12"
          cy="12"
          r={isDark ? 8 : 5}
          fill="currentColor"
          stroke="none"
          mask="url(#theme-toggle-crescent)"
          style={{ transition: 'r 400ms cubic-bezier(.4,0,.2,1)' }}
        />

        <g
          style={{
            transformOrigin: 'center',
            transform: isDark ? 'rotate(45deg) scale(0)' : 'rotate(0deg) scale(1)',
            opacity: isDark ? 0 : 1,
            transition: 'transform 400ms cubic-bezier(.4,0,.2,1), opacity 250ms ease',
          }}
        >
          <path d="M12 1.5v2M12 20.5v2M1.5 12h2M20.5 12h2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M19.4 4.6L18 6M6 18l-1.4 1.4" />
        </g>
      </svg>
    </button>
  );
}
