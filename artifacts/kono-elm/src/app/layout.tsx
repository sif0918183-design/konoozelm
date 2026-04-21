import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'موسوعة كنوز العلم الإلكترونية',
  description: 'موسوعة شاملة للكتب الإسلامية - قراءة مباشرة وتحميل من Archive.org',
  keywords: ['كتب إسلامية', 'مكتبة', 'تحميل كتب', 'قراءة كتب', 'Archive.org'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-gradient-to-b from-[#fafaf5] to-[#f0f5eb]">
        {children}
      </body>
    </html>
  );
}