'use client';

import { Mail } from 'lucide-react';
import Logo from './Logo';
import { translations } from '@/lib/translations';

interface FooterProps {
  lang?: 'ar' | 'en';
}

export default function Footer({ lang = 'ar' }: FooterProps) {
  const t = translations[lang];
  // User requested 2026 specifically
  const year = "2026";

  return (
    <footer className="bg-white border-t border-gray-100 py-16 mt-auto" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto px-4 text-center flex flex-col items-center">
        <Logo lang={lang} className="mb-6 scale-75 md:scale-90" />

        <div className="mb-8">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('show-pwa-install-prompt'))}
            className="text-primary-900/40 hover:text-primary-900 text-xs font-bold transition-colors border border-primary-900/10 px-4 py-1.5 rounded-full"
          >
            {t.pwa_install_title}
          </button>
        </div>

        <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed mb-6">
          {t.footer_text}
        </p>

        <a
          href="mailto:info@hudalibrary.com"
          className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-primary-50/50 hover:bg-gold-50 transition-all group mb-10 border border-primary-900/5 hover:border-gold-200 shadow-sm hover:shadow-md"
        >
          <div className="w-10 h-10 bg-primary-900 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-primary-900/20">
            <Mail className="w-5 h-5 text-gold-200" />
          </div>
          <span className="text-base font-bold text-primary-900 group-hover:text-gold-700 transition-colors">info@hudalibrary.com</span>
        </a>

        <div className="w-full pt-8 border-t border-gray-50 text-gray-400 text-xs">
          {t.rights_reserved.replace('{year}', year)}
        </div>
      </div>
    </footer>
  );
}
