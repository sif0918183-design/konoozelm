import type { Metadata } from 'next';
import { Tajawal, Amiri } from 'next/font/google';
import '../globals.css';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import LanguageRedirector from '@/components/LanguageRedirector';
import DocumentLanguageSetter from '@/components/DocumentLanguageSetter';

const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '700', '800', '900'],
  variable: '--font-tajawal',
});

const amiri = Amiri({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-amiri',
});

export const metadata: Metadata = {
  title: 'Kono Elm Encyclopedia',
  description: 'Comprehensive Electronic Library for Islamic Books - Read Online & Download from Archive.org',
  keywords: ['Islamic books', 'Library', 'Download books', 'Read books', 'Archive.org'],
  manifest: '/manifest.json?lang=en',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Islamic Library',
  },
};

export const viewport = {
  themeColor: '#154734',
};

export default function EnglishLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html className={`${tajawal.variable} ${amiri.variable}`}>
      <body className="min-h-screen bg-gradient-to-b from-[#fafaf5] to-[#f0f5eb] font-tajawal overflow-x-hidden">
        <LanguageRedirector />
        <DocumentLanguageSetter />
        {children}
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
