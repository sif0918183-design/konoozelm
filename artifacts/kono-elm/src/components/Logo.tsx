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
        <div className="flex flex-col items-center text-center -mt-6 md:-mt-8 lg:-mt-10 space-y-3 animate-fade-in">
          <div className="w-48 h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent shadow-[0_0_8px_rgba(245,158,11,0.3)]" />
          <p className={`text-[10px] md:text-xs lg:text-sm font-bold tracking-widest uppercase bg-gradient-to-b from-amber-200 via-gold-400 to-amber-700 bg-clip-text text-transparent drop-shadow-sm max-w-xs md:max-w-md lg:max-w-2xl ${lang === 'ar' ? 'font-tajawal' : 'font-inter'}`}>
            {t.subtitle}
          </p>
        </div>
      )}
    </Link>
  );
}
