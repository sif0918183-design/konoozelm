'use client';

import { useEffect, useRef } from 'react';

const HILLTOP_SCRIPT_SRC = "//fond-appointment.com/bSX.VDstdnGllK0DY/W/cr/deXm/9vuRZMUMlqkxPKTtcy0sNkDTcd5HN/DbkRtyNez/QJ0pNkz_kb1DM/w-";

/**
 * AdsterraSocialBar / HilltopAds Component
 *
 * Direct top-level injection of HilltopAds MultiTag Video Slider advertisement script.
 */
export default function AdsterraSocialBar() {
  const injectedRef = useRef(false);

  useEffect(() => {
    if (injectedRef.current) return;

    // Avoid duplicate script tags
    if (document.querySelector(`script[src="${HILLTOP_SCRIPT_SRC}"]`)) {
      injectedRef.current = true;
      return;
    }

    try {
      const script = document.createElement('script');
      (script as unknown as Record<string, unknown>).settings = {};
      script.src = HILLTOP_SCRIPT_SRC;
      script.async = true;
      script.referrerPolicy = 'no-referrer-when-downgrade';

      (document.body || document.head).appendChild(script);
      injectedRef.current = true;
    } catch (e) {
      console.error('Failed to inject HilltopAds script:', e);
    }
  }, []);

  return null;
}
