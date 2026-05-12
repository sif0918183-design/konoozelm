'use client';

import Script from 'next/script';
import { useRef } from 'react';

export default function AdBanner() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="w-full flex flex-col items-center my-[30px] mx-auto px-4">
      <span className="text-[10px] text-gray-400 mb-2 uppercase tracking-widest font-bold opacity-50">Advertisement</span>

      <Script
        src="https://pl29421746.profitablecpmratenetwork.com/17b6b0643dfbdfa818ed3b6b64955569/invoke.js"
        strategy="lazyOnload"
      />

      <div
        ref={containerRef}
        id="container-17b6b0643dfbdfa818ed3b6b64955569"
        className="w-full max-w-[728px] min-h-[90px] bg-gray-50/30 rounded-2xl border border-gray-100/50 flex items-center justify-center overflow-hidden transition-all duration-500 hover:shadow-lg"
      >
        {/* Adsterra will inject content here */}
      </div>
    </div>
  );
}
