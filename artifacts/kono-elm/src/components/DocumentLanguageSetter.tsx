'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function DocumentLanguageSetter() {
  const pathname = usePathname();

  useEffect(() => {
    const isEnglish = pathname?.startsWith('/en');
    const lang = isEnglish ? 'en' : 'ar';
    const dir = isEnglish ? 'ltr' : 'rtl';

    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [pathname]);

  return null;
}
