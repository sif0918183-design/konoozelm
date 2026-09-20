'use client';

import React from 'react';

const HILLTOP_SCRIPT_SRC = "//fond-appointment.com/brXDVxswd.GRlO0_YpWIcA/reQmP9mu/ZxU/lLkZPdTTc_0UM/zUgnwSO/DJkMtkNPzUQFz/OADpAm5ZM/wG";

const IFRAME_CONTENT = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  </style>
</head>
<body>
  <script>
    (function(pxgz){
      var d = document,
          s = d.createElement('script'),
          l = d.currentScript || d.scripts[d.scripts.length - 1];
      s.settings = pxgz || {};
      s.src = "${HILLTOP_SCRIPT_SRC}";
      s.async = true;
      s.referrerPolicy = 'no-referrer-when-downgrade';
      l.parentNode.insertBefore(s, l);
    })({})
  </script>
</body>
</html>`;

interface AdverticaAdProps {
  className?: string;
}

/**
 * HilltopAdsUnit / AdverticaAd Component
 *
 * Renders HilltopAds banner script inside an isolated iframe unit.
 * Each instance runs in its own window/document context, preventing script collisions
 * and allowing multiple independent ad units on the same page.
 */
export default function AdverticaAd({ className = '' }: AdverticaAdProps) {
  return (
    <div className={`my-2 mx-auto flex justify-center items-center overflow-hidden w-full max-w-full text-center ${className}`}>
      <iframe
        srcDoc={IFRAME_CONTENT}
        title="Sponsored Advertisement"
        width="300"
        height="250"
        className="border-0 overflow-hidden bg-transparent"
        style={{ border: 0, width: '300px', height: '250px', overflow: 'hidden' }}
      />
    </div>
  );
}

export const HilltopAdsUnit = AdverticaAd;
