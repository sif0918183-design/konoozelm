'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Download, Info } from 'lucide-react';
import { cn, optimizeArchiveUrl, formatBytes } from '@/lib/utils';
import { translations } from '@/lib/translations';
import { usePathname } from 'next/navigation';
import AdverticaAd from '@/components/AdverticaAd';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
  bookTitle: string;
  fileSize?: string | number;
}

export default function DownloadModal({
  isOpen,
  onClose,
  fileUrl,
  fileName,
  bookTitle,
  fileSize,
}: DownloadModalProps) {
  const pathname = usePathname();
  const isEnglish = pathname?.startsWith('/en');
  const lang = isEnglish ? 'en' : 'ar';
  const t = translations[lang];

  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setIsComplete(false);
      return;
    }

    // Scroll container to top immediately when opened
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }

    const duration = 15000; // 15 seconds
    const interval = 100;
    const increment = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsComplete(true);
          return 100;
        }
        return prev + increment;
      });
    }, interval);

    return () => {
      clearInterval(timer);
    };
  }, [isOpen]);

  const handleStartDownload = useCallback(() => {
    const optimizedUrl = optimizeArchiveUrl(fileUrl);
    const downloadName = bookTitle.endsWith('.pdf') ? bookTitle : `${bookTitle}.pdf`;

    // Use our local API proxy to bypass CORS and force download
    const proxyUrl = `/api/download?url=${encodeURIComponent(optimizedUrl)}&filename=${encodeURIComponent(downloadName)}`;

    const link = document.createElement('a');
    link.href = proxyUrl;
    link.setAttribute('download', downloadName);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [fileUrl, bookTitle]);

  // Trigger automatic download when complete, but do NOT close the window automatically
  useEffect(() => {
    if (isComplete && isOpen) {
      handleStartDownload();
    }
  }, [isComplete, isOpen, handleStartDownload]);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-[#fcfcf8] overflow-y-auto animate-in fade-in duration-300"
      dir={isEnglish ? 'ltr' : 'rtl'}
    >
      <div className="min-h-screen flex flex-col justify-between p-3 sm:p-4 md:p-8 max-w-7xl mx-auto relative">

        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-gold-200/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-900 text-gold-200 flex items-center justify-center font-bold shadow-md">
              <Download className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-primary-900">
                {t.preparing_book}
              </h1>
              <p className="text-xs text-gray-500 font-medium line-clamp-1 max-w-xs sm:max-w-md md:max-w-xl">
                {bookTitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 sm:p-3 bg-white hover:bg-gray-100 border border-gray-200 rounded-2xl text-gray-500 hover:text-gray-800 transition-colors shadow-sm flex items-center gap-2 text-xs md:text-sm font-bold"
          >
            <X className="w-5 h-5" />
            <span className="hidden sm:inline">{t.cancel_and_return}</span>
          </button>
        </div>

        {/* Center Content: Download Progress + Ads Grid + Compact Notice Box */}
        <div className="my-6 space-y-6">

          {/* Main Download Progress Banner */}
          <div className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 text-white rounded-3xl p-5 md:p-8 shadow-xl border border-gold-400/20 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-primary-400/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">

              {/* Progress Indicator */}
              <div className="w-full bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/15 flex flex-col items-center">
                <div className="flex justify-between items-center w-full mb-3 text-sm">
                  <span className="font-bold text-gold-200">{t.preparation_progress}</span>
                  <span className="text-2xl font-black text-white">{Math.round(progress)}%</span>
                </div>

                <div className="w-full bg-black/20 h-5 rounded-2xl overflow-hidden p-1 relative shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-gold-500 via-gold-400 to-amber-300 rounded-xl transition-all duration-300 ease-out relative"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:1.5rem_1.5rem] animate-[progress-stripe_2s_linear_infinite]" />
                  </div>
                </div>

                <div className="mt-3 text-xs text-primary-200 text-center font-medium w-full">
                  {fileSize && (
                    <span className="block mb-1 opacity-80" dir={isEnglish ? 'ltr' : 'rtl'}>
                      {formatBytes((Number(fileSize) * progress) / 100)} {t.of_label} {formatBytes(fileSize)}
                    </span>
                  )}
                  <span>{isComplete ? (isEnglish ? 'Download starting automatically...' : 'جاري بدء التحميل تلقائياً...') : t.dont_close_page}</span>
                </div>
              </div>

            </div>
          </div>

          {/* Compact Educational Notice Box */}
          <div className="bg-gradient-to-r from-primary-950 via-primary-900 to-primary-950 text-white rounded-2xl p-4 sm:p-6 border border-gold-400/20 shadow-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gold-500/20 border border-gold-500/30 text-gold-200 text-xs font-bold">
                  <Info className="w-3.5 h-3.5" />
                  {t.edu_notice}
                </div>
                <h2 className="text-base sm:text-lg font-bold text-gold-100">
                  {t.edu_title}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-primary-100/90 italic leading-relaxed max-w-xl">
                &ldquo;{t.edu_quote}&rdquo;
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Footer Action */}
        <div className="pt-4 border-t border-gray-200/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500 font-medium">
            {t.edu_desc}
          </p>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-8 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl text-xs sm:text-sm transition-colors"
          >
            {t.cancel_and_return}
          </button>
        </div>

      </div>

      <style jsx>{`
        @keyframes progress-stripe {
          from { background-position: 1rem 0; }
          to { background-position: 0 0; }
        }
      `}</style>
    </div>
  );
}
