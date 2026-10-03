/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Each resolves to a CSS variable defined in styles/globals.css, so
        // light/dark is handled entirely by the data-theme attribute on
        // <html> — no component needs a `dark:` variant.
        //
        // The `<alpha-value>` placeholder keeps opacity modifiers working:
        // `text-fg/60` compiles to rgb(20 20 20 / 0.6) in light mode and
        // rgb(255 255 255 / 0.6) in dark.
        bg: 'rgb(var(--bg) / <alpha-value>)',
        'bg-deep': 'rgb(var(--bg-deep) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        fg: 'rgb(var(--fg) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        warn: 'rgb(var(--warn) / <alpha-value>)',
      },
      boxShadow: {
        // Ambient accent glow. Reads as a neon bloom in dark mode and as a
        // soft coloured lift on paper in light mode — same token, and the
        // alpha is part of --glow so each theme tunes its own intensity.
        glow: '0 20px 60px -20px rgb(var(--glow))',
        'glow-sm': '0 0 60px -15px rgb(var(--glow))',
      },
      dropShadow: {
        glow: '0 20px 40px rgb(var(--glow))',
      },
    },
  },
  plugins: [],
};
