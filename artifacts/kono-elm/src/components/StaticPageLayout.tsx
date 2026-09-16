'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { translations } from '@/lib/translations';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Logo from '@/components/Logo';
import Footer from '@/components/Footer';
import AdverticaAd from '@/components/AdverticaAd';

interface StaticPageLayoutProps {
  children: React.ReactNode;
  title: string;
  lang: 'ar' | 'en';
}

export default function StaticPageLayout({ children, title, lang }: StaticPageLayoutProps) {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  return (
    <div className="min-h-screen bg-[#fcfcf8] font-tajawal flex flex-col" dir={isRtl ? 'rtl' : 'ltr'}>
      <header className="bg-primary-900 text-white pt-2 pb-12 px-4 relative overflow-hidden">
        <LanguageSwitcher light />
        <div className="max-w-7xl mx-auto flex flex-col items-center mt-8 md:mt-4">
          <Link href={lang === 'ar' ? '/' : '/en'} className="w-full hover:opacity-90 transition-opacity">
            <Logo lang={lang} />
          </Link>
        </div>
      </header>

      {/* Breadcrumbs */}
      <nav className="max-w-4xl mx-auto w-full px-4 py-4 mt-8 flex items-center gap-2 text-sm text-gray-500" aria-label="Breadcrumb">
        <Link href={lang === 'ar' ? '/' : '/en'} className="hover:text-primary-900 transition-colors">
          {t.home}
        </Link>
        {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4 rotate-180" />}
        <span className="text-gray-900 font-medium truncate" aria-current="page">
          {title}
        </span>
      </nav>

      <main className="max-w-4xl mx-auto w-full px-4 py-8 flex-grow space-y-8">
        <div className="flex justify-center my-4">
          <AdverticaAd />
        </div>
        <article className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-amiri font-bold text-primary-900 mb-8 border-b border-gray-100 pb-6 leading-tight">
            {title}
          </h1>
          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed space-y-6">
            {children}
          </div>
        </article>
        <div className="flex justify-center my-4">
          <AdverticaAd />
        </div>
      </main>

      <Footer lang={lang} />
    </div>
  );
}
