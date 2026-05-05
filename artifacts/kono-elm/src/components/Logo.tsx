'use client';

import Image from 'next/image';
import Link from 'next/link';
import { translations } from '@/lib/translations';

interface LogoProps {
  lang?: 'ar' | 'en';
  showText?: boolean;
  className?: string;
}

export default function Logo({ lang = 'ar', showText = true, className = '' }: LogoProps) {
  const t = translations[lang];

  return (
    <Link href={lang === 'en' ? '/en' : '/'} className={`flex flex-col items-center gap-2 group ${className}`}>
      <div className="relative w-64 h-32 md:w-80 md:h-40 lg:w-[450px] lg:h-[225px] transition-transform duration-300 group-hover:scale-[1.02]">
        <Image
          src="/icon-top.png"
          alt={t.title}
          fill
          className="object-contain"
          priority
        />
      </div>

      {showText && (
        <div className="flex flex-col items-center text-center -mt-4 md:-mt-6 lg:-mt-8 space-y-2 animate-fade-in">
          <h1 className={`text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-amber-700 via-amber-900 to-amber-700 bg-clip-text text-transparent ${lang === 'ar' ? 'font-amiri' : 'font-playfair'}`}>
            {t.title}
          </h1>
          <div className="w-32 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
          <p className={`text-[10px] md:text-xs lg:text-sm text-emerald-800/70 font-medium tracking-wide max-w-xs md:max-w-md lg:max-w-xl ${lang === 'ar' ? 'font-tajawal' : 'font-inter'}`}>
            {t.subtitle}
          </p>
        </div>
      )}
    </Link>
  );
}
