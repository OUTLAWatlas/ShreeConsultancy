import './globals.css';
import { THEME_INIT_SCRIPT } from '../lib/theme';

export const metadata = {
  title: 'Shree Consultancy Admin',
  description: 'Internal operations console — pipeline, tenders, invoicing.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning: the inline script below sets data-theme on
    // <html> before React hydrates, so the server and client markup will
    // legitimately differ on this one attribute.
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Runs before first paint so a dark-mode user never sees a white
            flash. Has to be dangerouslySetInnerHTML — a normal <script>
            child would be escaped as text. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="bg-bg font-mono text-fg antialiased">{children}</body>
    </html>
  );
}
