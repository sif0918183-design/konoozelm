'use client';

import { translations } from '@/lib/translations';
import Image from 'next/image';

interface LogoProps {
  lang?: 'ar' | 'en';
  light?: boolean;
  className?: string;
}

export default function Logo({ lang = 'ar', light = false, className = '' }: LogoProps) {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  return (
    <div className={`flex flex-col items-center text-center gap-4 sm:gap-6 ${className}`}>
      {/* New Logo Image - Medium to Large Size */}
      <div className="relative group">
        {/* Glow effect for luxury feel */}
        <div className={`absolute inset-0 blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-700 ${
          light ? 'bg-gold-400' : 'bg-primary-600'
        }`} />

        <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 transition-all duration-700 hover:scale-105">
          <Image
            src="/icon.png"
            alt={t.title}
            fill
            priority
            className="object-contain drop-shadow-2xl"
          />
        </div>
      </div>

      {/* Titles Section */}
      <div className="flex flex-col items-center">
        <h1 className={`font-bold tracking-tight leading-tight transition-all duration-500 ${
          isRtl ? 'text-3xl sm:text-4xl md:text-5xl' : 'text-xl sm:text-3xl md:text-4xl'
        } ${
          light ? 'text-gold-200 drop-shadow-md' : 'text-primary-950'
        } ${isRtl ? 'font-amiri' : 'font-playfair italic'}`}>
          {t.title}
        </h1>

        <div className="flex items-center gap-4 mt-3">
          <div className={`h-[1.5px] w-10 md:w-16 rounded-full ${
            light ? 'bg-gradient-to-r from-transparent via-gold-500/50 to-transparent' : 'bg-gradient-to-r from-transparent via-gold-600/50 to-transparent'
          }`} />

          <span className={`text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-[0.25em] transition-colors duration-500 whitespace-nowrap ${
            light ? 'text-gold-200/90' : 'text-primary-800'
          } ${isRtl ? 'font-tajawal' : 'font-inter'}`}>
            {lang === 'ar' ? 'المكتبة الرقمية العالمية' : 'Global Digital Library'}
          </span>

          <div className={`h-[1.5px] w-10 md:w-16 rounded-full ${
            light ? 'bg-gradient-to-r from-transparent via-gold-500/50 to-transparent' : 'bg-gradient-to-r from-transparent via-gold-600/50 to-transparent'
          }`} />
        </div>
      </div>
    </div>
  );
}
