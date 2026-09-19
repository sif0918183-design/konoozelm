'use client';

import { useState, useEffect, useCallback } from 'react';
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

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setIsComplete(false);
      return;
    }

    const duration = 6000; // 6 seconds
    const interval = 50;
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

    return () => clearInterval(timer);
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

  useEffect(() => {
    if (isComplete && isOpen) {
      handleStartDownload();
      const closeTimer = setTimeout(() => {
        onClose();
      }, 1000);
      return () => clearTimeout(closeTimer);
    }
  }, [isComplete, isOpen, onClose, handleStartDownload]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#fcfcf8]/90 backdrop-blur-md animate-in fade-in duration-500" dir={isEnglish ? 'ltr' : 'rtl'}>
      <div className="bg-white rounded-[2rem] shadow-[0_32px_64px_-12px_rgba(21,71,52,0.15)] w-full max-w-5xl min-h-[70vh] overflow-hidden border border-gold-100 flex flex-col md:flex-row animate-in slide-in-from-bottom-8 duration-700">

        {/* Left side: Advertising/Awareness Area */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-primary-900 to-primary-800 p-6 md:p-8 text-white flex flex-col justify-between relative overflow-hidden overflow-y-auto max-h-[90vh]">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/20 border border-gold-500/30 text-gold-200 text-xs font-bold">
              <Info className="w-4 h-4" />
              {t.edu_notice}
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-gold-100 leading-tight">
              {t.edu_title}
            </h2>

            <div className="space-y-3 text-primary-50/90 leading-relaxed text-sm md:text-base italic">
              <p>
                {t.edu_quote}
              </p>
              <p className={`text-xs md:text-sm not-italic text-primary-200 ${isEnglish ? 'border-l-4' : 'border-r-4'} border-gold-500 ${isEnglish ? 'pl-3' : 'pr-3'}`}>
                {t.edu_desc}
              </p>
            </div>

            {/* Modal Ads 1 & 2 */}
            <div className="mt-4 grid grid-cols-1 gap-3">
              <div className="p-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-center justify-center">
                <AdverticaAd adIndex={1} className="my-1" />
              </div>
              <div className="p-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-center justify-center">
                <AdverticaAd adIndex={2} className="my-1" />
              </div>
            </div>
          </div>
        </div>

        {/* Right side: Download Process */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col items-center justify-between bg-white relative overflow-y-auto max-h-[90vh]">
          <button
            onClick={onClose}
            className={`absolute top-6 ${isEnglish ? 'right-6' : 'left-6'} p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600`}
          >
            <X className="w-6 h-6" />
          </button>

          <div className="w-full max-w-sm flex flex-col items-center">
            <div className="mb-10">
              <div className="w-24 h-24 bg-primary-50 rounded-3xl flex items-center justify-center mb-6 relative rotate-3 group">
                <Download className={cn(
                  "w-12 h-12 text-primary-900 transition-all duration-700",
                  isComplete ? "scale-110" : "animate-bounce"
                )} />
                <div className="absolute -inset-2 border-2 border-gold-200 rounded-[2rem] opacity-50 group-hover:rotate-6 transition-transform duration-500" />
                {isComplete && (
                  <div className="absolute inset-0 border-4 border-gold-500 rounded-3xl animate-ping opacity-20" />
                )}
              </div>
            </div>

            <h3 className="text-2xl font-bold text-primary-900 mb-3 text-center">
              {t.preparing_book}
            </h3>
            <p className="text-gray-500 text-center mb-10 font-medium leading-relaxed">
              {bookTitle}
            </p>

            {/* Progress Section */}
            <div className="w-full space-y-4 mb-10">
              <div className="flex justify-between items-end mb-2">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-primary-700">{t.preparation_progress}</span>
                  {fileSize && (
                    <span className="text-[10px] text-gray-400 font-medium" dir={isEnglish ? 'ltr' : 'rtl'}>
                      {formatBytes((Number(fileSize) * progress) / 100)} {t.of_label} {formatBytes(fileSize)}
                    </span>
                  )}
                </div>
                <span className="text-2xl font-black text-primary-900">{Math.round(progress)}%</span>
              </div>

              <div className="w-full bg-gray-100 h-6 rounded-2xl overflow-hidden relative shadow-inner p-1">
                <div
                  className="h-full bg-gradient-to-l from-primary-900 via-primary-700 to-primary-600 rounded-xl transition-all duration-500 ease-out relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1.5rem_1.5rem] animate-[progress-stripe_2s_linear_infinite]" />
                </div>
              </div>

              <p className="text-xs text-center text-gray-400 font-medium">
                {isComplete ? t.preparing_download : t.dont_close_page}
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl border-2 border-gray-100 text-gray-500 font-bold hover:bg-gray-50 hover:text-red-600 hover:border-red-100 transition-all duration-300 text-sm"
            >
              {t.cancel_and_return}
            </button>
          </div>

          {/* Modal Ads 3, 4, 5, 6 Grid inside right panel */}
          <div className="w-full mt-6 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-2 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
              <AdverticaAd adIndex={3} className="my-1" />
            </div>
            <div className="p-2 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
              <AdverticaAd adIndex={4} className="my-1" />
            </div>
            <div className="p-2 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
              <AdverticaAd adIndex={5} className="my-1" />
            </div>
            <div className="p-2 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
              <AdverticaAd adIndex={6} className="my-1" />
            </div>
          </div>
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
