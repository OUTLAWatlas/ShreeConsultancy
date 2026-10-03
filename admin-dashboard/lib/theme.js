// Theme plumbing shared by every themed surface in this app.
//
// The source of truth is a `data-theme` attribute on <html>; CSS does the
// rest (see app/globals.css). localStorage only records the user's explicit
// choice.

export const THEME_STORAGE_KEY = 'shree-theme';

// The brief asked for a light-first UI, so a first-time visitor gets light
// regardless of their OS setting. Change this to 'system' below if you'd
// rather follow prefers-color-scheme instead.
export const DEFAULT_THEME = 'light';

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Private browsing or blocked storage — the theme still applies for
    // this page view, it just won't be remembered. Not worth surfacing.
  }
}

export function readStoredTheme() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  } catch {
    return null;
  }
}

// Runs before first paint, inlined into <head> — see app/layout.jsx.
//
// Without this, the server-rendered HTML arrives with no data-theme and
// React only sets it after hydration, so a dark-mode user gets a white
// flash on every navigation. Keep it small, synchronous, and dependency
// free: it is executed as a raw string, not bundled.
//
// `theme-ready` is added one frame later so the colour transition in
// globals.css doesn't animate the initial paint.
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('${THEME_STORAGE_KEY}');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : ${DEFAULT_THEME === 'system'
        ? "(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')"
        : `'${DEFAULT_THEME}'`};
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', '${DEFAULT_THEME === 'system' ? 'light' : DEFAULT_THEME}');
  }
  requestAnimationFrame(function () {
    document.documentElement.classList.add('theme-ready');
  });
})();
`;
