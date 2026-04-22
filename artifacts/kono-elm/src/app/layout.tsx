import type { Metadata } from 'next';
import { Tajawal } from 'next/font/google';
import './globals.css';

const tajawal = Tajawal({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '700', '800', '900'],
  variable: '--font-tajawal',
});

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
    <html lang="ar" dir="rtl" className={tajawal.variable}>
      <body className="min-h-screen bg-gradient-to-b from-[#fafaf5] to-[#f0f5eb] font-tajawal">
        {children}
      </body>
    </html>
  );
}