'use client';

import { useEffect, useRef } from 'react';

interface AdverticaAdProps {
  className?: string;
}

/**
 * AdverticaAd Component
 *
 * Renders the Advertica responsive ad banner.
 * Uses client-side DOM injection to ensure the responsive script
 * executes correctly within React component lifecycle and SPA navigation.
 */
export default function AdverticaAd({ className = '' }: AdverticaAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous ad content to support SPA navigation
    containerRef.current.innerHTML = '';

    // Create ins element with required Advertica attributes
    const ins = document.createElement('ins');
    ins.style.width = '0px';
    ins.style.height = '0px';
    ins.setAttribute('data-width', '0');
    ins.setAttribute('data-height', '0');
    ins.className = 'a5fc7a60ee6';
    ins.setAttribute('data-domain', '//data527.click');
    ins.setAttribute('data-affquery', '/b71419b3fe82c7034708/5fc7a60ee6/?placementName=default');

    // Create script element with async loading
    const script = document.createElement('script');
    script.src = '//data527.click/js/responsive.js';
    script.async = true;

    ins.appendChild(script);
    containerRef.current.appendChild(ins);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`my-6 mx-auto flex justify-center items-center overflow-hidden w-full max-w-full min-h-[60px] text-center ${className}`}
    />
  );
}
