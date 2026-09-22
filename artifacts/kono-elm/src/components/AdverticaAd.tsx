'use client';

interface AdverticaAdProps {
  className?: string;
}

/**
 * AdsterraUnit / AdverticaAd / HilltopAdsUnit Component
 *
 * Returned null as HilltopAds MultiTag is injected directly at root level via AdsterraSocialBar,
 * avoiding inline iframe conflicts or empty white space boxes.
 */
export default function AdverticaAd({ className = '' }: AdverticaAdProps) {
  return null;
}

export const AdsterraUnit = AdverticaAd;
export const HilltopAdsUnit = AdverticaAd;
