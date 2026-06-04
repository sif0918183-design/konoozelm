'use client';

import { Mail, Info, MessageCircle, Shield, FileText, Copyright } from 'lucide-react';
import Logo from './Logo';
import { translations } from '@/lib/translations';
import Link from 'next/link';

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

        <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed mb-8">
          {t.footer_text}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 w-full max-w-4xl mb-12">
          <Link
            href={lang === 'ar' ? '/about-us' : '/en/about-us'}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-md border border-transparent hover:border-gold-200 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <Info className="w-5 h-5 text-primary-900" />
            </div>
            <span className="text-xs font-bold text-gray-900">{t.about_us}</span>
          </Link>

          <Link
            href={lang === 'ar' ? '/contact-us' : '/en/contact-us'}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-md border border-transparent hover:border-gold-200 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <MessageCircle className="w-5 h-5 text-primary-900" />
            </div>
            <span className="text-xs font-bold text-gray-900">{t.contact_us}</span>
          </Link>

          <Link
            href={lang === 'ar' ? '/privacy-policy' : '/en/privacy-policy'}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-md border border-transparent hover:border-gold-200 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <Shield className="w-5 h-5 text-primary-900" />
            </div>
            <span className="text-xs font-bold text-gray-900">{t.privacy_policy}</span>
          </Link>

          <Link
            href={lang === 'ar' ? '/terms-of-use' : '/en/terms-of-use'}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-md border border-transparent hover:border-gold-200 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5 text-primary-900" />
            </div>
            <span className="text-xs font-bold text-gray-900">{t.terms_of_use}</span>
          </Link>

          <Link
            href={lang === 'ar' ? '/copyright-policy' : '/en/copyright-policy'}
            className="col-span-2 md:col-span-1 flex flex-col items-center gap-2 p-4 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-md border border-transparent hover:border-gold-200 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <Copyright className="w-5 h-5 text-primary-900" />
            </div>
            <span className="text-xs font-bold text-gray-900">{t.copyright_policy}</span>
          </Link>
        </div>

        <a
          href="mailto:info@hudalibrary.com"
          className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-primary-50/50 hover:bg-gold-50 transition-all group mb-10 border border-primary-900/5 hover:border-gold-200 shadow-sm hover:shadow-md"
        >
          <div className="w-10 h-10 bg-primary-900 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-primary-900/20">
            <Mail className="w-5 h-5 text-gold-200" />
          </div>
          <span className="text-base font-bold text-primary-900 group-hover:text-gold-700 transition-colors">info@hudalibrary.com</span>
        </a>

        <div className="w-full pt-8 border-t border-gray-50 text-gray-400 text-xs flex flex-col md:flex-row items-center justify-center gap-2">
          <span>© {year} Huda Library.</span>
          <span>{lang === 'ar' ? 'جميع الحقوق محفوظة.' : 'All Rights Reserved.'}</span>
        </div>
      </div>
    </footer>
  );
}
