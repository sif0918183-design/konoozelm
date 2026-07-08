'use client';

import { useEffect, useRef } from 'react';

const SCRIPT_URL = '';

/**
 * AdsterraSocialBar Component
 *
 * This component manages the lazy loading of the Adsterra Social Bar advertisement.
 * It is designed to be non-intrusive and optimized for Core Web Vitals.
 */
export default function AdsterraSocialBar() {
  const injectedRef = useRef(false);

  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') return;

    const injectScript = () => {
      if (injectedRef.current) return;

      // Avoid duplicate script tags in the DOM
      if (document.querySelector(`script[src="${SCRIPT_URL}"]`)) {
        injectedRef.current = true;
        return;
      }

      const script = document.createElement('script');
      script.src = SCRIPT_URL;
      script.async = true;
      // data-cfasync="false" helps prevent issues with Cloudflare Rocket Loader
      script.setAttribute('data-cfasync', 'false');

      document.body.appendChild(script);
      injectedRef.current = true;

      // Once injected, we can stop listening for interactions
      removeInteractionListeners();
    };

    const handleInteraction = () => {
      injectScript();
    };

    const removeInteractionListeners = () => {
      window.removeEventListener('scroll', handleInteraction);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('mousemove', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };

    const setupInteractionListeners = () => {
      window.addEventListener('scroll', handleInteraction, { once: true, passive: true });
      window.addEventListener('click', handleInteraction, { once: true, passive: true });
      window.addEventListener('mousemove', handleInteraction, { once: true, passive: true });
      window.addEventListener('touchstart', handleInteraction, { once: true, passive: true });
    };

    // 1. Guaranteed injection after a 4-second delay (as requested: 3-5 seconds)
    // This ensures maximum impressions even if the user doesn't interact immediately.
    const timerId = setTimeout(() => {
      injectScript();
    }, 4000);

    // 2. Immediate injection on first user interaction
    // This makes the ad load "on-demand" as the user engages with the page.
    setupInteractionListeners();

    return () => {
      clearTimeout(timerId);
      removeInteractionListeners();
    };
  }, []);

  return null;
}
