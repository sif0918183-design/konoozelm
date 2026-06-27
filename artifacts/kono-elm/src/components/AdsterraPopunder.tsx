'use client';

import { useEffect } from 'react';

const STORAGE_KEY = 'adsterra-last-shown';
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

export default function AdsterraPopunder() {
  useEffect(() => {
    const getStoredTime = (): string | null => {
      // Try localStorage
      try {
        const localValue = localStorage.getItem(STORAGE_KEY);
        if (localValue) return localValue;
      } catch (e) {
        // localStorage might be disabled or unavailable
      }

      // Try Cookies fallback
      try {
        const match = document.cookie.match(new RegExp('(^| )' + STORAGE_KEY + '=([^;]+)'));
        if (match) return match[2];
      } catch (e) {
        // Cookies might be disabled
      }

      return null;
    };

    const updateStoredTime = () => {
      const now = Date.now().toString();

      // Set in localStorage
      try {
        localStorage.setItem(STORAGE_KEY, now);
      } catch (e) {
        // localStorage might be disabled
      }

      // Set in Cookies (expires in 30 days to ensure we track the 24h window even if localStorage is cleared)
      try {
        const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
        document.cookie = `${STORAGE_KEY}=${now}; expires=${expires}; path=/; SameSite=Lax`;
      } catch (e) {
        // Cookies might be disabled
      }
    };

    const lastShown = getStoredTime();
    const now = Date.now();

    if (!lastShown || (now - parseInt(lastShown, 10)) >= TWENTY_FOUR_HOURS) {
      // Inject Adsterra script
      const script = document.createElement('script');
      script.src = 'https://pl30089135.effectivecpmnetwork.com/bd/fa/32/bdfa32cdd990b0f31e1df6d03d7e336a.js';
      script.async = true;

      // Update the stored time once we've decided to load the script
      updateStoredTime();

      document.body.appendChild(script);
    }
  }, []);

  return null;
}
