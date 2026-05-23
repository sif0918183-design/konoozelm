'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';

/**
 * Toggle this constant to enable or disable the Adsterra Social Bar script.
 */
const ENABLE_ADSTERRA = true;

export default function AdsterraScript() {
  const pathname = usePathname();

  if (!ENABLE_ADSTERRA) return null;

  // Handle exclusions (development environment and specific paths)
  // We use process.env.NODE_ENV to ensure consistency between SSR and CSR
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Exclude admin and edit routes
  const isExcludedPath =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/edit') ||
    pathname.includes('/admin/') ||
    pathname.includes('/edit/');

  if (isDevelopment || isExcludedPath) {
    return null;
  }

  return (
    <Script
      id="adsterra-social-bar"
      src="https://pl29421747.effectivecpmnetwork.com/50/21/19/502119867360dcf8fb64639f085d4a66.js"
      strategy="afterInteractive"
      data-cfasync="false"
    />
  );
}
