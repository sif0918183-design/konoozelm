'use client';

import { translations } from '@/lib/translations';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  lang?: 'ar' | 'en';
}

export default function Logo({ className = '', lang = 'ar' }: LogoProps) {
  const t = translations[lang];

  return (
    <div className={`flex flex-col items-center text-center w-full ${className}`}>
      {/*
          New Header Logo - Wide and Professional
          The image already contains both Arabic and English titles.
          Responsive: full width (edge-to-edge) on mobile, constrained on larger screens.
          No shadows or glow as per user request.
      */}
      <div className="relative w-full sm:max-w-[550px] md:max-w-[650px] aspect-[2/1] transition-transform duration-500 hover:scale-[1.01]">
        <Image
          src="/icon-top.png"
          alt={t.title}
          fill
          priority
          className="object-contain"
        />
      </div>
    </div>
  );
}
