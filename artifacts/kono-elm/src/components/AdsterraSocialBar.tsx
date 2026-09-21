'use client';

import { useEffect, useRef } from 'react';

const HILLTOP_SCRIPT_SRC = '//fond-appointment.com/bSX.VDstdnGllK0DY/W/cr/deXm/9vuRZMUMlqkxPKTtcy0sNkDTcd5HN/DbkRtyNez/QJ0pNkz_kb1DM/w-';

/**
 * AdsterraSocialBar / HilltopAds Component
 *
 * This component manages the dynamic loading of the HilltopAds MultiTag Video Slider advertisement.
 */
export default function AdsterraSocialBar() {
  const injectedRef = useRef(false);

  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') return;

    const injectScript = () => {
      if (injectedRef.current) return;

      // Avoid duplicate script tags in the DOM
      if (document.querySelector(`script[src="${HILLTOP_SCRIPT_SRC}"]`)) {
        injectedRef.current = true;
        return;
      }

      (function(dnl: Record<string, unknown>){
        var d = document,
            s = d.createElement('script'),
            l = d.currentScript || d.scripts[d.scripts.length - 1];
        (s as unknown as Record<string, unknown>).settings = dnl || {};
        s.src = HILLTOP_SCRIPT_SRC;
        s.async = true;
        s.referrerPolicy = 'no-referrer-when-downgrade';
        if (l && l.parentNode) {
          l.parentNode.insertBefore(s, l);
        } else {
          (d.head || d.body).appendChild(s);
        }
      })({});

      injectedRef.current = true;

      // Once injected, stop listening for interactions
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

    // Guaranteed injection after a delay or on first interaction
    const timerId = setTimeout(() => {
      injectScript();
    }, 4000);

    setupInteractionListeners();

    return () => {
      clearTimeout(timerId);
      removeInteractionListeners();
    };
  }, []);

  return null;
}
