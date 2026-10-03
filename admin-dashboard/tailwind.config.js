/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Semantic tokens — prefer these in new code.
        //
        // Each resolves to a CSS variable defined in app/globals.css, so
        // light/dark is handled entirely by the data-theme attribute on
        // <html>; no component needs a `dark:` variant anywhere.
        //
        // The `<alpha-value>` placeholder is what keeps opacity modifiers
        // working — `text-fg/60` compiles to rgb(20 20 20 / 0.6) in light
        // mode and rgb(255 255 255 / 0.6) in dark.
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-hover': 'rgb(var(--surface-hover) / <alpha-value>)',
        fg: 'rgb(var(--fg) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        warn: 'rgb(var(--warn) / <alpha-value>)',
      },
      fontFamily: {
        mono: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
