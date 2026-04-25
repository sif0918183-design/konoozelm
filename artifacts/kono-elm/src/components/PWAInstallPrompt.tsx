'use client';

import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Check if user has already dismissed it this session
      const isDismissed = sessionStorage.getItem('pwa-prompt-dismissed');
      if (!isDismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the PWA install prompt');
    } else {
      console.log('User dismissed the PWA install prompt');
    }

    // We've used the prompt, and can't use it again
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white rounded-2xl shadow-2xl border border-primary-100 p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-primary-900 rounded-xl flex items-center justify-center flex-shrink-0">
              <img src="/icon.svg" alt="App Icon" className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">تثبيت موسوعة كنوز العلم</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                تصفح واقرأ آلاف الكتب الإسلامية بسهولة من شاشتك الرئيسية
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 p-1"
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
            تثبيت الآن
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
          >
            ليس الآن
          </button>
        </div>
      </div>
    </div>
  );
}
