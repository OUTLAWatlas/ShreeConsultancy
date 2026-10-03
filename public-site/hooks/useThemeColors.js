'use client';

import { useEffect, useState } from 'react';

// WebGL can't read CSS variables — three.js materials take real colour
// values, so the canvas would stay cyan-on-black after a switch to light
// mode while the page around it changed. This hook pulls the current token
// values out of the DOM and re-reads them whenever data-theme changes.
//
// Returns CSS colour strings ("rgb(10 110 138)"), which three.js's Color
// parses directly.
const TOKENS = ['accent', 'warn', 'bg', 'bg-deep', 'fg'];

function readTokens() {
  if (typeof window === 'undefined') return {};
  const styles = getComputedStyle(document.documentElement);
  return TOKENS.reduce((acc, name) => {
    const raw = styles.getPropertyValue(`--${name}`).trim();
    // Tokens are stored as bare "R G B" triplets; some carry an alpha
    // ("0 229 255 / 0.3"), which rgb() also accepts.
    //
    // Missing tokens are omitted rather than set to undefined — callers
    // spread this over their defaults, and an explicit undefined would
    // overwrite them.
    if (raw) acc[name] = `rgb(${raw})`;
    return acc;
  }, {});
}

export function useThemeColors() {
  // Server render and first client render must agree, so start empty and
  // fill in on mount. Callers pass these to materials, which simply use
  // their own defaults for the one frame before this resolves.
  const [colors, setColors] = useState({});

  useEffect(() => {
    setColors(readTokens());

    const observer = new MutationObserver(() => setColors(readTokens()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);

  return colors;
}

// The active theme name, for the handful of places that need to vary
// something other than a colour — line opacity in the 3D scenes, mostly.
// A stroke at 0.25 alpha reads clearly as neon on black but almost
// disappears as dark teal on paper, so the scenes lift it in light mode.
export function useThemeName() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const read = () => setTheme(document.documentElement.getAttribute('data-theme') || 'light');
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);

  return theme;
}
