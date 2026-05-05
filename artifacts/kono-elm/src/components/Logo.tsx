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
    <div className={`flex flex-col items-center gap-2 group ${className}`}>
      <div className="relative w-full aspect-[2/1] md:w-[500px] md:h-[250px] lg:w-[750px] lg:h-[375px] transition-transform duration-300 group-hover:scale-[1.02]">
        <Image
          src="/icon-top.png"
          alt={t.title}
          fill
          className="object-contain px-2 md:px-0"
          priority
        />
      </div>

      {showText && (
        <div className="flex flex-col items-center text-center -mt-6 md:-mt-8 lg:-mt-10 space-y-3 animate-fade-in">
          <div className="w-48 h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent shadow-[0_0_8px_rgba(245,158,11,0.3)]" />
          <p className="text-[10px] md:text-sm font-tajawal font-bold tracking-[0.2em] md:tracking-[0.4em] bg-gradient-to-r from-amber-200 via-gold-500 to-amber-200 bg-clip-text text-transparent uppercase drop-shadow-sm">
            {t.global_digital_library}
          </p>
        </div>
      )}
    </div>
  );
}
