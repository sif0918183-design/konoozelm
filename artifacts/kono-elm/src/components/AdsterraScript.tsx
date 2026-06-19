'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Toggle this constant to enable or disable the Adsterra Social Bar script.
 */
const ENABLE_ADSTERRA = true;

const SCRIPT_URL = 'https://pl29421747.effectivecpmnetwork.com/50/21/19/502119867360dcf8fb64639f085d4a66.js';

export default function AdsterraScript() {
  const pathname = usePathname();

  useEffect(() => {
    if (!ENABLE_ADSTERRA) return;

    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isAdmin = pathname.includes('/admin');
    const isEdit = pathname.includes('/edit');

    const shouldInject = !isLocalhost && !isAdmin && !isEdit;

    const existingScript = document.querySelector(`script[src="${SCRIPT_URL}"]`);

    if (shouldInject) {
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = SCRIPT_URL;
        script.defer = true;
        document.body.appendChild(script);
      }
    } else {
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    }
  }, [pathname]);

  return null;
}
