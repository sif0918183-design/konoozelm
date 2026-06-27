'use client';

import { useEffect } from 'react';

const AD_STORAGE_KEY = 'adsterra-last-shown';
const AD_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * AdsterraPopunder component
 * This component manages the display of the Adsterra Popunder advertisement.
 * It ensures the ad script is only loaded once every 24 hours to optimize performance
 * and user experience, using localStorage with a Cookie fallback.
 */
export default function AdsterraPopunder() {
  useEffect(() => {
    const checkAndShowAd = () => {
      const now = Date.now();
      let lastShown = null;

      // Try getting from localStorage
      try {
        lastShown = localStorage.getItem(AD_STORAGE_KEY);
      } catch (e) {
        // localStorage might be unavailable in some contexts
      }

      // Fallback to cookie if localStorage is empty
      if (!lastShown) {
        const cookies = document.cookie.split(';');
        const adCookie = cookies.find(c => c.trim().startsWith(AD_STORAGE_KEY + '='));
        if (adCookie) {
          lastShown = adCookie.split('=')[1];
        }
      }

      const lastShownTime = lastShown ? parseInt(lastShown, 10) : 0;

      // Only show if never shown or last shown more than 24 hours ago
      if (now - lastShownTime > AD_COOLDOWN) {
        const scriptSrc = 'https://pl30089135.effectivecpmnetwork.com/bd/fa/32/bdfa32cdd990b0f31e1df6d03d7e336a.js';

        // Prevent double injection if component is mounted multiple times
        if (document.querySelector(`script[src="${scriptSrc}"]`)) {
          return;
        }

        // Inject the script
        const script = document.createElement('script');
        script.src = scriptSrc;
        script.async = true;
        document.body.appendChild(script);

        // Update storage and cookie to mark as shown
        const timestamp = now.toString();

        try {
          localStorage.setItem(AD_STORAGE_KEY, timestamp);
        } catch (e) {
          // Ignore storage errors
        }

        // Set cookie with 24 hour expiry
        const expires = new Date(now + AD_COOLDOWN).toUTCString();
        document.cookie = `${AD_STORAGE_KEY}=${timestamp}; expires=${expires}; path=/; SameSite=Lax`;
      }
    };

    // Run the check
    checkAndShowAd();
  }, []);

  return null;
}
