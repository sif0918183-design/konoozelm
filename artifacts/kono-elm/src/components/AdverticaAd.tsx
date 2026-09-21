'use client';

import React, { useEffect, useRef } from 'react';

const ADSTERRA_SCRIPT_SRC = "https://pl29421746.profitableratecpmnetwork.com/17b6b0643dfbdfa818ed3b6b64955569/invoke.js";
const ADSTERRA_CONTAINER_ID = "container-17b6b0643dfbdfa818ed3b6b64955569";

interface AdverticaAdProps {
  className?: string;
}

/**
 * AdsterraUnit / AdverticaAd Component
 *
 * Renders Adsterra CPM banner script inside an isolated iframe unit.
 * Monkey-patches document.write inside the iframe so async ad scripts don't
 * reopen and wipe the iframe document when injecting ad markup.
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
      min-height: 100%;
      overflow-x: hidden;
      overflow-y: auto;
      background: transparent;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
    }
    #${ADSTERRA_CONTAINER_ID} {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
    }
  </style>
  <script>
    // Intercept document.write calls from async ad script to prevent document wipeout after doc.close()
    document.write = function(html) {
      var container = document.getElementById('${ADSTERRA_CONTAINER_ID}') || document.body;
      if (container) {
        var range = document.createRange();
        range.selectNode(container);
        var fragment = range.createContextualFragment(html);
        container.appendChild(fragment);
      }
    };
    document.writeln = function(html) {
      document.write(html + '\\n');
    };
  </script>
</head>
<body>
  <div id="${ADSTERRA_CONTAINER_ID}"></div>
  <script async="async" data-cfasync="false" src="${ADSTERRA_SCRIPT_SRC}"></script>
</body>
</html>`;

    doc.open();
    doc.write(htmlContent);
    doc.close();

    loadedRef.current = true;
  }, []);

  return (
    <div className={`my-2 mx-auto flex justify-center items-center overflow-hidden w-full max-w-full text-center ${className}`}>
      <iframe
        ref={iframeRef}
        title="Sponsored Advertisement"
        width="300"
        height="500"
        className="border-0 overflow-y-auto overflow-x-hidden bg-transparent rounded-2xl"
        style={{ border: 0, width: '300px', height: '500px', overflowY: 'auto', overflowX: 'hidden' }}
      />
    </div>
  );
}

export const AdsterraUnit = AdverticaAd;
export const HilltopAdsUnit = AdverticaAd;
