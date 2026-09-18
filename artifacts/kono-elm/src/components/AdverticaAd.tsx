'use client';

import { useEffect, useRef } from 'react';

interface AdverticaAdProps {
  className?: string;
}

/**
 * AdverticaAd Component
 *
 * Renders the advertisement banner script.
 * Uses client-side DOM injection to ensure the script
 * executes correctly within React component lifecycle and SPA navigation.
 */
export default function AdverticaAd({ className = '' }: AdverticaAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous ad content to support SPA navigation
    containerRef.current.innerHTML = '';

    (function (iqgg: Record<string, unknown>) {
      const d = document;
      const s = d.createElement('script');
      (s as unknown as { settings: unknown }).settings = iqgg || {};
      s.src = '//fond-appointment.com/bEXjVns.d-Goli0OYwWecl/SeomZ9Vu-ZnUNlqkxPiTzcT0GM/zzgmwvOoDrk/t/NBzFQHzfOCDAAH5SMYwQ';
      s.async = true;
      s.referrerPolicy = 'no-referrer-when-downgrade';
      if (containerRef.current) {
        containerRef.current.appendChild(s);
      }
    })({});
  }, []);

  return (
    <div
      ref={containerRef}
      className={`my-6 mx-auto flex justify-center items-center overflow-hidden w-full max-w-full min-h-[60px] text-center ${className}`}
    />
  );
}
