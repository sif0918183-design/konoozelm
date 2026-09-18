'use client';

import { useEffect, useRef } from 'react';

interface AdverticaAdProps {
  className?: string;
}

/**
 * AdverticaAd Component
 *
 * Renders the primary responsive ad placement.
 * Uses client-side DOM injection to ensure the ad script
 * executes correctly within React component lifecycle and SPA navigation.
 */
export default function AdverticaAd({ className = '' }: AdverticaAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous ad content to support SPA navigation
    containerRef.current.innerHTML = '';

    // Create ad container div
    const adDiv = document.createElement('div');
    adDiv.id = 'container-17b6b0643dfbdfa818ed3b6b64955569';

    // Create script element with async loading
    const script = document.createElement('script');
    script.src = 'https://pl29421746.profitableratecpmnetwork.com/17b6b0643dfbdfa818ed3b6b64955569/invoke.js';
    script.async = true;
    script.setAttribute('data-cfasync', 'false');

    containerRef.current.appendChild(adDiv);
    containerRef.current.appendChild(script);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`my-6 mx-auto flex justify-center items-center overflow-hidden w-full max-w-full min-h-[60px] text-center ${className}`}
    />
  );
}
