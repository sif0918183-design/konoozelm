'use client';

import React, { useEffect, useRef, useState } from 'react';

const HILLTOP_SCRIPT_SRC = "//fond-appointment.com/bSX.VDstdnGllK0DY/W/cr/deXm/9vuRZMUMlqkxPKTtcy0sNkDTcd5HN/DbkRtyNez/QJ0pNkz_kb1DM/w-";

interface AdverticaAdProps {
  className?: string;
}

/**
 * AdsterraUnit / AdverticaAd / HilltopAdsUnit Component
 *
 * Renders HilltopAds CPM / Video Slider script inside an isolated iframe unit.
 * Automatically measures and resizes iframe height based on rendered content,
 * collapsing to 0px / hidden state if no inline ad content is rendered to prevent blank whitespace.
 */
export default function AdverticaAd({ className = '' }: AdverticaAdProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const loadedRef = useRef(false);
  const [hasContent, setHasContent] = useState(false);
  const [adHeight, setAdHeight] = useState(0);

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
      height: auto;
      min-height: 0;
      background: transparent;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow: hidden;
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

    // Monitor for content height inside the iframe
    const updateHeight = () => {
      try {
        const body = doc.body;
        if (!body) return;

        let maxChildBottom = 0;
        for (let i = 0; i < body.children.length; i++) {
          const child = body.children[i] as HTMLElement;
          if (child.tagName !== 'SCRIPT' && child.tagName !== 'STYLE') {
            const rect = child.getBoundingClientRect();
            if (rect.height > 0) {
              maxChildBottom = Math.max(maxChildBottom, rect.bottom);
            }
          }
        }

        const calculatedHeight = maxChildBottom > 0 ? Math.ceil(maxChildBottom) : 0;
        if (calculatedHeight > 0) {
          setHasContent(true);
          setAdHeight(calculatedHeight);
        } else {
          setHasContent(false);
          setAdHeight(0);
        }
      } catch (e) {
        // Ignore cross-origin errors if any
      }
    };

    const observer = new MutationObserver(updateHeight);
    if (doc.body) {
      observer.observe(doc.body, { childList: true, subtree: true, attributes: true });
    }

    const intervalId = setInterval(updateHeight, 500);

    return () => {
      observer.disconnect();
      clearInterval(intervalId);
    };
  }, []);

  return (
    <div
      className={`mx-auto flex justify-center items-center overflow-hidden w-full max-w-full text-center transition-all duration-300 ${hasContent ? 'my-2' : 'h-0 my-0 overflow-hidden'} ${className}`}
      style={{ display: hasContent ? 'flex' : 'none' }}
    >
      <iframe
        ref={iframeRef}
        title="Sponsored Advertisement"
        width="300"
        height={adHeight || 250}
        className="border-0 overflow-hidden bg-transparent rounded-2xl"
        style={{
          border: 0,
          width: '100%',
          maxWidth: '300px',
          height: adHeight ? `${adHeight}px` : 'auto',
          overflow: 'hidden',
          display: hasContent ? 'block' : 'none',
        }}
      />
    </div>
  );
}

export const AdsterraUnit = AdverticaAd;
export const HilltopAdsUnit = AdverticaAd;
