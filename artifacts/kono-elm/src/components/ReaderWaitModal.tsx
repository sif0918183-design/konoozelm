'use client';

import { useState, useEffect } from 'react';
import { Loader2, BookOpen } from 'lucide-react';
import { translations } from '@/lib/translations';
import { usePathname } from 'next/navigation';
import AdBanner from './AdBanner';

interface ReaderWaitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  bookTitle: string;
}

export default function ReaderWaitModal({
  isOpen,
  onClose,
  onComplete,
  bookTitle,
}: ReaderWaitModalProps) {
  const pathname = usePathname();
  const isEnglish = pathname?.startsWith('/en');
  const lang = isEnglish ? 'en' : 'ar';
  const t = translations[lang];

  const [timeLeft, setTimeLeft] = useState(10);

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(10);
      return;
    }

    if (timeLeft === 0) {
      onComplete();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, timeLeft, onComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#0f2e22]/60 backdrop-blur-md animate-in fade-in duration-300" dir={isEnglish ? 'ltr' : 'rtl'}>
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-gold-100 flex flex-col animate-in zoom-in duration-500">
        <div className="p-8 md:p-12 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-primary-50 rounded-2xl flex items-center justify-center mb-6 relative">
            <Loader2 className="w-10 h-10 text-primary-900 animate-spin" />
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gold-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
              {timeLeft}
            </div>
          </div>

          <h3 className="text-2xl font-bold text-primary-900 mb-2">
            {t.opening_reader}
          </h3>
          <p className="text-gray-500 mb-8 font-medium line-clamp-2">
            {bookTitle}
          </p>

          <div className="w-full bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-8">
            <AdBanner />
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 font-bold transition-colors text-sm"
          >
            {t.admin_cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
