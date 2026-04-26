'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function LanguageRedirector() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only run on root path or if no language set in URL
    if (pathname === '/') {
      const savedLang = localStorage.getItem('lang');
      if (savedLang === 'en') {
        router.push('/en');
      }
    }
  }, [pathname, router]);

  return null;
}
