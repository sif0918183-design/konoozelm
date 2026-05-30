'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Download, X } from 'lucide-react';
import { translations, type Language } from '@/lib/translations';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();
  const [lang, setLang] = useState<Language>('ar');

  useEffect(() => {
    // Determine language from URL
    const isEnglish = pathname?.startsWith('/en');
    setLang(isEnglish ? 'en' : 'ar');
  }, [pathname]);

  useEffect(() => {
    const handler = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);

      // Check 24h cooldown logic
      const lastPromptedAt = localStorage.getItem('pwa-last-prompted-at');
      const twentyFourHours = 24 * 60 * 60 * 1000;

      if (lastPromptedAt) {
        const timeSinceLastPrompt = Date.now() - parseInt(lastPromptedAt);
        if (timeSinceLastPrompt < twentyFourHours) {
          return;
        }
      }

      // 15 second delay before showing
      const timer = setTimeout(() => {
        setIsVisible(true);
        localStorage.setItem('pwa-last-prompted-at', Date.now().toString());
      }, 15000);

      return () => clearTimeout(timer);
    };

    window.addEventListener('beforeinstallprompt', handler);

    const showHandler = () => {
      setIsVisible(true);
    };

    window.addEventListener('show-pwa-install-prompt', showHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('show-pwa-install-prompt', showHandler);
    };
  }, []);

  const t = translations[lang];

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the PWA install prompt');
      // On successful install, we don't need to show it again
      localStorage.setItem('pwa-last-prompted-at', (Date.now() * 10).toString()); // Far future
    } else {
      console.log('User dismissed the PWA install prompt');
      handleDismiss();
    }

    // We've used the prompt, and can't use it again
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-last-prompted-at', Date.now().toString());
  };

  if (!isVisible) return null;

  const isRtl = lang === 'ar';

  return (
    <div className={`fixed bottom-6 ${isRtl ? 'left-6 md:left-auto md:right-6' : 'right-6 md:right-auto md:left-6'} left-6 right-6 md:w-96 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-2xl shadow-2xl border border-primary-100 p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-primary-900 rounded-xl flex items-center justify-center flex-shrink-0 relative overflow-hidden">
              <Image src="/icon.png" alt="App Icon" width={48} height={48} className="object-cover" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">{t.pwa_install_title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t.pwa_install_desc}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className={`${isRtl ? 'mr-auto' : 'ml-auto'} text-gray-400 hover:text-gray-600 p-1`}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleInstallClick}
            className="flex-1 bg-primary-900 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-800 transition-colors"
          >
            <Download size={18} />
            {t.pwa_install_btn}
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
          >
            {t.pwa_cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
