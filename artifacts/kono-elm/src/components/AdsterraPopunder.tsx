'use client';

import { useEffect, useRef } from 'react';

const SCRIPT_SRC = 'https://pl30089135.profitableratecpmnetwork.com/bd/fa/32/bdfa32cdd990b0f31e1df6d03d7e336a.js';

/**
 * AdsterraPopunder component
 * Ensures the popunder ad script is injected into <head> if not already present.
 */
export default function AdsterraPopunder() {
  const injectedRef = useRef(false);

  useEffect(() => {
    if (injectedRef.current) return;

    if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      injectedRef.current = true;
      return;
    }

    try {
      const script = document.createElement('script');
      script.src = SCRIPT_SRC;
      script.async = true;
      (document.head || document.body).appendChild(script);
      injectedRef.current = true;
    } catch (e) {
      console.error('Failed to inject popunder script:', e);
    }
  }, []);

  return null;
}
