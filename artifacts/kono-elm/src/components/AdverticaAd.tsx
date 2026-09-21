'use client';

import React from 'react';

const ADSTERRA_SCRIPT_SRC = "https://pl29421746.profitableratecpmnetwork.com/17b6b0643dfbdfa818ed3b6b64955569/invoke.js";
const ADSTERRA_CONTAINER_ID = "container-17b6b0643dfbdfa818ed3b6b64955569";

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
  <div id="${ADSTERRA_CONTAINER_ID}"></div>
  <script async="async" data-cfasync="false" src="${ADSTERRA_SCRIPT_SRC}"></script>
</body>
</html>`;

interface AdverticaAdProps {
  className?: string;
}

/**
 * AdsterraUnit / AdverticaAd Component
 *
 * Renders Adsterra CPM banner script inside an isolated iframe unit.
 * Each instance runs in its own window/document context, preventing container ID collisions
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

export const AdsterraUnit = AdverticaAd;
export const HilltopAdsUnit = AdverticaAd;
