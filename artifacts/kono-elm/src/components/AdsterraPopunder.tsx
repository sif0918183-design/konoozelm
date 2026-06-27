'use client';

import { useEffect } from 'react';

const AD_SESSION_KEY = 'adsterra-shown';

/**
 * AdsterraPopunder component
 * This component manages the display of the Adsterra Popunder advertisement.
 * It ensures the ad script is only loaded once per session to optimize performance
 * and user experience, using sessionStorage.
 */
export default function AdsterraPopunder() {
  useEffect(() => {
    const checkAndShowAd = () => {
      let isShown = false;

      // Try getting from sessionStorage
      try {
        isShown = sessionStorage.getItem(AD_SESSION_KEY) === 'true';
      } catch (e) {
        // sessionStorage might be unavailable in some contexts
      }

      // Only show if not already shown in this session
      if (!isShown) {
        const scriptSrc = 'https://pl30089135.effectivecpmnetwork.com/bd/fa/32/bdfa32cdd990b0f31e1df6d03d7e336a.js';

        // Prevent double injection if component is mounted multiple times in the same page
        if (document.querySelector(`script[src="${scriptSrc}"]`)) {
          return;
        }

        // Inject the script
        const script = document.createElement('script');
        script.src = scriptSrc;
        script.async = true;
        document.body.appendChild(script);

        // Update sessionStorage to mark as shown for this session
        try {
          sessionStorage.setItem(AD_SESSION_KEY, 'true');
        } catch (e) {
          // Ignore storage errors
        }
      }
    };

    // Run the check
    checkAndShowAd();
  }, []);

  return null;
}
