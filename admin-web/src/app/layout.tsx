import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'My Prayer - Admin Management Portal',
  description: 'Enterprise backend content management dashboard for My Prayer App',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-stone-50 text-stone-900 antialiased">
        {children}
      </body>
    </html>
  );
}
