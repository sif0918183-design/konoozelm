import type { Metadata } from 'next';
import { Tajawal, Amiri, Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import LanguageRedirector from '@/components/LanguageRedirector';
import DocumentLanguageSetter from '@/components/DocumentLanguageSetter';
import { Analytics } from "@vercel/analytics/react";
import AdsterraScript from '../components/AdsterraScript';

const tajawal = Tajawal({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '700', '800', '900'],
  variable: '--font-tajawal',
});

const amiri = Amiri({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-amiri',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
});

export const metadata: Metadata = {
  title: 'مكتبة الهدى',
  description: 'موسوعة شاملة للكتب والرسائل والمخطوطات الإسلامية - قراءة مباشرة وتحميل من Archive.org',
  keywords: ['كتب إسلامية', 'مكتبة', 'تحميل كتب', 'قراءة كتب', 'Archive.org', 'مكتبة الهدى'],
  manifest: '/manifest.json?lang=ar',
  icons: {
    icon: [
      { url: '/favicon.png' },
      { url: '/icon.png', sizes: '1024x1024', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'مكتبة الهدى',
  },
  verification: {
    other: {
      'msvalidate.01': 'B3F0A80329F60E6CDAAF9BA26C5E2166',
    },
  },
};

export const viewport = {
  themeColor: '#154734',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html className={`${tajawal.variable} ${amiri.variable} ${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-[#f8f9fa] font-tajawal overflow-x-hidden">
        <LanguageRedirector />
        <DocumentLanguageSetter />
        {children}
        <PWAInstallPrompt />
        <Analytics />
        <AdsterraScript />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                  }, function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}