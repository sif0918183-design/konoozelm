'use client';

import { useEffect, useRef } from 'react';

interface AdverticaAdProps {
  className?: string;
}

/**
 * AdverticaAd Component
 *
 * Renders the primary ad banner using client-side DOM injection.
 */
export default function AdverticaAd({ className = '' }: AdverticaAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous ad content to support SPA navigation
    containerRef.current.innerHTML = '';

    const placeholder = document.createElement('script');
    containerRef.current.appendChild(placeholder);

    (function(vbpjre){
      var d = document,
          s = d.createElement('script'),
          l = placeholder;
      (s as any).settings = vbpjre || {};
      s.src = "//fond-appointment.com/bBX-V/s.d/GNl/0YYeWice/JeomS9oueZ/UflokAPsT/ct0OMhz_cjxVNKjKk/tzNoz/QPz/NHzUEy3yMQwY";
      s.async = true;
      s.referrerPolicy = 'no-referrer-when-downgrade';
      if (l && l.parentNode) {
        l.parentNode.insertBefore(s, l);
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
