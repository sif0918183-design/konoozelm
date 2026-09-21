'use client';

import React, { useEffect, useRef } from 'react';

const HILLTOP_SCRIPT_SRC = "//fond-appointment.com/bSX.VDstdnGllK0DY/W/cr/deXm/9vuRZMUMlqkxPKTtcy0sNkDTcd5HN/DbkRtyNez/QJ0pNkz_kb1DM/w-";

interface AdverticaAdProps {
  className?: string;
}

/**
 * AdsterraUnit / AdverticaAd / HilltopAdsUnit Component
 *
 * Renders HilltopAds CPM / Video Slider script inside an isolated iframe unit.
 */
export default function AdverticaAd({ className = '' }: AdverticaAdProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!iframeRef.current || loadedRef.current) return;

    const iframe = iframeRef.current;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="referrer" content="no-referrer-when-downgrade">
  <base target="_blank">
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: transparent;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
  </style>
</head>
<body>
  <script>
    (function(dnl){
    var d = document,
        s = d.createElement('script'),
        l = d.currentScript || d.scripts[d.scripts.length - 1];
    s.settings = dnl || {};
    s.src = "${HILLTOP_SCRIPT_SRC}";
    s.async = true;
    s.referrerPolicy = 'no-referrer-when-downgrade';
    if (l && l.parentNode) {
      l.parentNode.insertBefore(s, l);
    } else {
      (d.head || d.body).appendChild(s);
    }
    })({})
  </script>
</body>
</html>`;

    doc.open();
    doc.write(htmlContent);
    doc.close();

    loadedRef.current = true;
  }, []);

  return (
    <div className={`my-1 mx-auto flex justify-center items-center overflow-hidden w-full max-w-full text-center ${className}`}>
      <iframe
        ref={iframeRef}
        title="Sponsored Advertisement"
        width="300"
        height="250"
        className="border-0 overflow-hidden bg-transparent rounded-2xl"
        style={{ border: 0, width: '100%', maxWidth: '300px', height: '250px', overflow: 'hidden' }}
      />
    </div>
  );
}

export const AdsterraUnit = AdverticaAd;
export const HilltopAdsUnit = AdverticaAd;
