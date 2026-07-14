import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tax Assistant | Israeli & US Tax Filing',
  description: 'Upload your tax documents. AI extracts, aggregates, and fills your 1301/1040 tax forms automatically.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <div className="app-bg" />
        {children}
      </body>
    </html>
  );
}
