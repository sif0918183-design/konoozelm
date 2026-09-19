'use client';

import { useEffect, useRef } from 'react';

const AD_SCRIPTS = [
  '//fond-appointment.com/bEXjVns.d-Goli0OYwWecl/SeomZ9Vu-ZnUNlqkxPiTzcT0GM/zzgmwvOoDrk/t/NBzFQHzfOCDAAH5SMYwQ',
  '//fond-appointment.com/bEXmV.s/d/GKlj0VYJWtcg/_eKmS9QuOZ/Unl/kLPaTtck0/Mkz/gAzqM/zPMvthNizkQOz-OnD/MSz/NWwm',
  '//fond-appointment.com/bZX/V/s.dtG/ln0zYZWmcv/qe/mE9Wu/Z/UHlTk/PPTmc_0JMLzEgZzHN/DMkOtINyzxQSzXO/DLM_1IMywN',
  '//fond-appointment.com/beXxVnsXd.G/ls0LYMW/cK/teMmD9/ugZRUQlrkUP/T/cW0bMbzLgFzDOdD/k/t/NhzFQWzPO/D/M-5/MXwl',
  '//fond-appointment.com/bIXAVms.dpG/lS0BYwWfc_/ieomU9OurZyUrl/k/PpT/cB0/MUzdcdxdNWjDkmtDN/zZQezWN/zaEZ3cMIwZ',
  '//fond-appointment.com/bOX.V/sVd/G/lu0AYFW/ce/_eamW9/u/ZHUGlnkIPrTucP0IMsz_Q/zcNjjaEjtzN/zsQ_zkNRDLM/2hNuQH',
  '//fond-appointment.com/bLX.VgsWdDGclj0-YtWKcI/ue/m_9JulZfUwlik/PFTDch0tNhDOEm1sOdT/MFtVNjzIQ/0fMjTcU/5YNZwi',
  '//fond-appointment.com/b.XnVIszdMGtlR0dY/WRcO/ueEmn9/uwZrU/lrkJPmTHcb0ENkDwEc2KMJDPUQtxNNz/Qy0lM/T-YvwROOQC',
];

let globalAdCount = 0;

interface AdverticaAdProps {
  className?: string;
  adIndex?: number;
}

/**
 * AdverticaAd Component
 *
 * Renders advertisement banner scripts sequentially (1 to 6).
 * Uses client-side DOM injection to ensure scripts execute correctly
 * within React component lifecycle and SPA navigation.
 */
export default function AdverticaAd({ className = '', adIndex }: AdverticaAdProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const assignedIndexRef = useRef<number | null>(null);

  if (assignedIndexRef.current === null) {
    if (typeof adIndex === 'number' && adIndex >= 1 && adIndex <= AD_SCRIPTS.length) {
      assignedIndexRef.current = adIndex - 1;
    } else {
      assignedIndexRef.current = globalAdCount % AD_SCRIPTS.length;
      globalAdCount++;
    }
  }

  useEffect(() => {
    if (!iframeRef.current || assignedIndexRef.current === null) return;

    const scriptSrc = AD_SCRIPTS[assignedIndexRef.current];
    if (!scriptSrc) return;

    const iframe = iframeRef.current;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    const htmlContent = `<!DOCTYPE html>
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
    (function(vobigb){
      var d = document,
          s = d.createElement('script'),
          l = d.currentScript || d.scripts[d.scripts.length - 1];
      s.settings = vobigb || {};
      s.src = "${scriptSrc}";
      s.async = true;
      s.referrerPolicy = 'no-referrer-when-downgrade';
      l.parentNode.insertBefore(s, l);
    })({});
  </script>
</body>
</html>`;

    doc.open();
    doc.write(htmlContent);
    doc.close();
  }, []);

  return (
    <div className={`my-2 mx-auto flex justify-center items-center overflow-hidden w-full max-w-full text-center ${className}`}>
      <iframe
        ref={iframeRef}
        title="Sponsored Advertisement"
        width="300"
        height="250"
        className="border-0 overflow-hidden bg-transparent"
        style={{ border: 0, width: '300px', height: '250px', overflow: 'hidden' }}
      />
    </div>
  );
}
