'use client';

import { useEffect, useRef } from 'react';

const POPUNDER_SCRIPT_SRC = 'https://pl30089135.profitableratecpmnetwork.com/bd/fa/32/bdfa32cdd990b0f31e1df6d03d7e336a.js';

/**
 * AdsterraPopunder component
 * Injects the requested popunder script into the document head.
 */
export default function AdsterraPopunder() {
  const injectedRef = useRef(false);

  useEffect(() => {
    if (injectedRef.current) return;

    // Prevent double injection if component is mounted multiple times in the same page
    if (document.querySelector(`script[src="${POPUNDER_SCRIPT_SRC}"]`)) {
      injectedRef.current = true;
      return;
    }

    try {
      const script = document.createElement('script');
      script.src = POPUNDER_SCRIPT_SRC;
      script.async = true;

      (document.head || document.body).appendChild(script);
      injectedRef.current = true;
    } catch (e) {
      console.error('Failed to inject popunder script:', e);
    }
  }, []);

  return null;
}
