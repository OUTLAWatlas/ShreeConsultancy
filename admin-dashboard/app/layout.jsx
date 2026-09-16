import './globals.css';

export const metadata = {
  title: 'Shree Consultancy Admin',
  description: 'Internal operations console — pipeline, tenders, invoicing.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-ink font-mono text-white antialiased">{children}</body>
    </html>
  );
}
