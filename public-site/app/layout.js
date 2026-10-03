import '../styles/globals.css';
import { THEME_INIT_SCRIPT } from '../lib/theme';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shreeconsultancy.com';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Shree Consultancy — Electrical, Civil & Structural Engineering',
  description:
    'Shree Consultancy designs switchyards, substations, and industrial power systems for clients across India, the Middle East, and Africa — from first estimate to good-for-construction drawings.',
  openGraph: {
    type: 'website',
    siteName: 'Shree Consultancy',
    title: 'Shree Consultancy — Electrical, Civil & Structural Engineering',
    description:
      'Switchyards, substations, and industrial power systems — from first estimate to good-for-construction drawings.',
  },
};

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning: the inline script sets data-theme on <html>
    // before React hydrates, so server and client markup legitimately
    // differ on that one attribute.
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Runs before first paint so a dark-mode visitor never gets a
            white flash. Must be dangerouslySetInnerHTML — a normal
            <script> child would be escaped as text. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
