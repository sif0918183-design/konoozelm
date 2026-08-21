'use client';

import React from 'react';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  qrImageUrl?: string;
  className?: string;
}

export default function QRCodeDisplay({ value, size = 180, qrImageUrl, className = '' }: QRCodeDisplayProps) {
  if (qrImageUrl && qrImageUrl.trim().length > 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-3 bg-white rounded-2xl shadow-inner border border-gray-100 ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrImageUrl}
          alt="Wallet QR Code"
          width={size}
          height={size}
          className="rounded-xl object-contain max-w-full"
        />
      </div>
    );
  }

  const encodedValue = encodeURIComponent(value);
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedValue}&margin=10`;

  return (
    <div className={`flex flex-col items-center justify-center p-3 bg-white rounded-2xl shadow-md border border-gray-200 relative group ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrApiUrl}
        alt={`QR Code for ${value}`}
        width={size}
        height={size}
        className="rounded-xl object-contain bg-white"
        loading="lazy"
      />
    </div>
  );
}
