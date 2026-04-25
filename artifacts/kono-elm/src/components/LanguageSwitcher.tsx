'use client';

import Link from 'next/link';
import { Globe } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

export default function LanguageSwitcher({ light = false }: { light?: boolean }) {
  const pathname = usePathname();
  const isEnglish = pathname?.startsWith('/en');

  const togglePath = isEnglish
    ? (pathname.replace(/^\/en/, '') || '/')
    : `/en${pathname === '/' ? '' : pathname}`;

  const handleLanguageSwitch = () => {
    const nextLang = isEnglish ? 'ar' : 'en';
    localStorage.setItem('lang', nextLang);
  };

  useEffect(() => {
    const currentLang = isEnglish ? 'en' : 'ar';
    localStorage.setItem('lang', currentLang);
  }, [isEnglish]);

  return (
    <div className={`absolute top-4 ${isEnglish ? 'right-4' : 'left-4'} z-20`}>
      <Link
        href={togglePath}
        onClick={handleLanguageSwitch}
        className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold backdrop-blur-sm transition-all border",
            light
                ? "bg-white/10 hover:bg-white/20 text-white border-white/10"
                : "bg-primary-900/10 hover:bg-primary-900/20 text-primary-900 border-primary-900/10"
        )}
      >
        <Globe className="w-4 h-4" />
        {isEnglish ? 'العربية' : 'English'}
      </Link>
    </div>
  );
}
