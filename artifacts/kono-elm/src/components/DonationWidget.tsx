'use client';

import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { translations, type Language } from '@/lib/translations';
import DonationModal, { DonationSettings } from './DonationModal';

interface DonationWidgetProps {
  lang?: Language;
}

export default function DonationWidget({ lang = 'ar' }: DonationWidgetProps) {
  const t = translations[lang];
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<DonationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/donations/settings')
      .then((res) => res.json())
      .then((data: DonationSettings) => {
        setSettings(data);
      })
      .catch((err) => {
        console.error('Failed to load donation settings for widget:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (!isLoading && settings && (!settings.enabled || !settings.show_button)) {
    return null;
  }

  const buttonText = lang === 'ar' ? t.donate_button_text : t.donate_button_text;

  return (
    <>
      {/* Floating Action Button */}
      <div
        className={`fixed z-40 bottom-5 ${
          lang === 'ar' ? 'left-5' : 'right-5'
        } pb-[env(safe-area-inset-bottom)] transition-all duration-300 transform hover:scale-105 active:scale-95`}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 bg-gradient-to-r from-primary-950 via-primary-900 to-primary-950 text-white px-4 py-2.5 rounded-full shadow-2xl border border-gold-400/40 hover:border-gold-400 hover:shadow-gold-500/20 transition-all"
          aria-label={buttonText}
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-gold-500"></span>
          </span>

          <Heart className="w-4 h-4 text-gold-400 fill-gold-400 group-hover:animate-bounce transition-transform" />

          <span className="text-xs sm:text-sm font-bold tracking-wide text-gold-100 group-hover:text-white transition-colors">
            {buttonText}
          </span>
        </button>
      </div>

      {/* Donation Modal */}
      <DonationModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        lang={lang}
        initialSettings={settings}
      />
    </>
  );
}
