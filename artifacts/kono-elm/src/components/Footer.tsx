'use client';

import Link from 'next/link';
import { Mail } from 'lucide-react';
import Logo from './Logo';
import { translations } from '@/lib/translations';

interface FooterProps {
  lang?: 'ar' | 'en';
}

export default function Footer({ lang = 'ar' }: FooterProps) {
  const t = translations[lang];
  const isArabic = lang === 'ar';

  return (
    <footer className="bg-white border-t border-gray-100 py-12 mt-auto" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto px-4 text-center flex flex-col items-center">
        <Logo lang={lang} className="mb-6 scale-75 md:scale-90" />

        <button
          onClick={() => window.dispatchEvent(new CustomEvent('show-pwa-install-prompt'))}
          className="mb-8 text-primary-900/40 hover:text-primary-900 text-xs font-bold transition-colors border border-primary-900/10 px-3 py-1 rounded-full"
        >
          {t.pwa_install_title}
        </button>

        <div className="mb-8 flex flex-col items-center gap-4">
          <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed italic">
            &quot;{t.footer_text}&quot;
          </p>

          <a
            href="mailto:info@hudalibrary.com"
            className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-900 rounded-full hover:bg-primary-100 transition-all border border-primary-900/5 group"
          >
            <Mail className="w-4 h-4 text-gold-600 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-bold">info@hudalibrary.com</span>
          </a>
        </div>

        <div className="pt-8 border-t border-gray-50 text-gray-400 text-xs w-full">
          {t.rights_reserved.replace('{year}', new Date().getFullYear().toString())}
        </div>
      </div>
    </footer>
  );
}
