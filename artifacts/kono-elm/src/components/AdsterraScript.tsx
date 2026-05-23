'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Toggle this constant to enable or disable the Adsterra Social Bar script.
 */
const ENABLE_ADSTERRA = true;

export default function AdsterraScript() {
  const pathname = usePathname();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (!ENABLE_ADSTERRA) {
      setShouldRender(false);
      return;
    }

    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isExcludedPath = pathname.includes('/admin') || pathname.includes('/edit');

    if (isLocalhost || isExcludedPath) {
      setShouldRender(false);
    } else {
      setShouldRender(true);
    }
  }, [pathname]);

  if (!shouldRender) return null;

  return (
    <Script
      src="https://pl29421747.effectivecpmnetwork.com/50/21/19/502119867360dcf8fb64639f085d4a66.js"
      strategy="afterInteractive"
    />
  );
}
