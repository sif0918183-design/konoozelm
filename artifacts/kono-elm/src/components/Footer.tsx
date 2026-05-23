'use client';

import { Mail } from 'lucide-react';
import Logo from './Logo';
import { translations } from '@/lib/translations';

interface FooterProps {
  lang?: 'ar' | 'en';
}

export default function Footer({ lang = 'ar' }: FooterProps) {
  const t = translations[lang];
  const currentYear = new Date().getFullYear().toString();

  return (
    <footer className="bg-white border-t border-gray-100 py-16 mt-auto" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto px-4 text-center flex flex-col items-center">
        <Logo lang={lang} className="mb-6 scale-75 md:scale-90" />

        <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('show-pwa-install-prompt'))}
            className="text-primary-900/40 hover:text-primary-900 text-xs font-bold transition-colors border border-primary-900/10 px-4 py-1.5 rounded-full"
          >
            {t.pwa_install_title}
          </button>

          <a
            href="mailto:info@hudalibrary.com"
            className="flex items-center gap-2 text-primary-900 hover:text-gold-600 transition-all group"
          >
            <div className="w-8 h-8 bg-primary-50 rounded-full flex items-center justify-center group-hover:bg-gold-50 transition-colors shadow-sm">
              <Mail className="w-4 h-4 text-primary-700 group-hover:text-gold-600" />
            </div>
            <span className="text-sm font-bold">info@hudalibrary.com</span>
          </a>
        </div>

        <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed mb-8">
          {t.footer_text}
        </p>

        <div className="w-full pt-8 border-t border-gray-50 text-gray-400 text-xs">
          {t.rights_reserved.replace('{year}', currentYear)}
        </div>
      </div>
    </footer>
  );
}
