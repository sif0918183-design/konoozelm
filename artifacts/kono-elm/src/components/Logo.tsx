'use client';

import { translations } from '@/lib/translations';

interface LogoProps {
  lang?: 'ar' | 'en';
  light?: boolean;
  className?: string;
}

export default function Logo({ lang = 'ar', light = false, className = '' }: LogoProps) {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  return (
    <div className={`flex items-center gap-3 md:gap-5 max-w-full ${isRtl ? 'flex-row-reverse' : 'flex-row'} ${className}`}>
      {/* Scalable SVG Logo Icon - Enhanced Luxury Style */}
      <div className={`relative flex-shrink-0 w-14 h-14 md:w-16 md:h-16 flex items-center justify-center rounded-2xl shadow-2xl overflow-hidden group transition-all duration-700 hover:scale-105 hover:rotate-2 -mt-1 md:mt-0 ${
        light
          ? 'bg-gradient-to-br from-white/25 to-white/5 backdrop-blur-xl border border-white/40 shadow-gold-500/20'
          : 'bg-gradient-to-br from-primary-900 to-primary-800 border border-primary-700 shadow-primary-900/40'
      }`}>
        <div className="absolute inset-0 bg-gold-500/15 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="absolute inset-0 border border-gold-400/20 rounded-2xl m-1 pointer-events-none" />

        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`w-8 h-8 md:w-9 md:h-9 transition-all duration-500 group-hover:scale-110 ${light ? 'text-gold-200' : 'text-gold-400'}`}
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          <path d="M9 7h7" />
          <path d="M9 11h7" />
          <path d="M9 15h4" />
          <circle cx="16" cy="15" r="1" fill="currentColor" />
        </svg>
      </div>

      <div className={`flex flex-col ${isRtl ? 'text-right' : 'text-left'}`}>
        <h1 className={`font-bold tracking-tight leading-[1.4] md:leading-[1.2] py-1 mb-0.5 transition-all duration-700 bg-clip-text text-transparent bg-[linear-gradient(110deg,#b45309,45%,#fbbf24,55%,#b45309)] bg-[length:200%_100%] animate-shine drop-shadow-sm ${
          isRtl ? 'text-2xl sm:text-3xl md:text-4xl whitespace-nowrap' : 'text-lg sm:text-2xl md:text-3xl break-words px-1'
        } ${isRtl ? 'font-amiri' : 'font-playfair italic'}`}>
          {t.title}
        </h1>
        <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className={`h-[2px] w-8 md:w-12 rounded-full hidden sm:block ${light ? 'bg-gradient-to-r from-gold-500/60 to-transparent' : 'bg-gradient-to-r from-gold-600/60 to-transparent'}`} />
          <span className={`text-[10px] sm:text-[11px] md:text-xs font-bold uppercase tracking-[0.15em] sm:tracking-[0.3em] transition-colors duration-500 whitespace-nowrap ${
            light ? 'text-gold-200/90' : 'text-primary-800'
          } ${isRtl ? 'font-tajawal' : 'font-inter'}`}>
            {lang === 'ar' ? 'المكتبة الرقمية العالمية' : 'Global Digital Library'}
          </span>
        </div>
      </div>
    </div>
  );
}
