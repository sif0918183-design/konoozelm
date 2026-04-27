'use client';

import Link from 'next/link';
import { Globe } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

export default function LanguageSwitcher({ light = false }: { light?: boolean }) {
  const pathname = usePathname();
  const isEnglish = pathname?.startsWith('/en');

  // If we are on a specific item page (category/book/author),
  // redirecting to the same path in the other language will 404 because slugs are unique per language.
  // We check if the path is complex and redirect to the home page of that language instead.
  const isSubPage = pathname !== '/' && pathname !== '/en';

  const togglePath = isEnglish
    ? (isSubPage ? '/' : (pathname.replace(/^\/en/, '') || '/'))
    : (isSubPage ? '/en' : `/en${pathname === '/' ? '' : pathname}`);

  const handleLanguageSwitch = () => {
    const nextLang = isEnglish ? 'ar' : 'en';
    localStorage.setItem('lang', nextLang);
  };

  useEffect(() => {
    const currentLang = isEnglish ? 'en' : 'ar';
    localStorage.setItem('lang', currentLang);
  }, [isEnglish]);

  return (
    <div className={`absolute top-3 ${isEnglish ? 'right-2 md:right-4' : 'left-2 md:left-4'} z-20`}>
      <Link
        href={togglePath}
        onClick={handleLanguageSwitch}
        className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-bold backdrop-blur-sm transition-all border",
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
