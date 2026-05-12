'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Download, Info, CheckCircle2 } from 'lucide-react';
import { cn, optimizeArchiveUrl, formatBytes } from '@/lib/utils';
import { translations } from '@/lib/translations';
import { usePathname } from 'next/navigation';
import AdBanner from './AdBanner';

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

  const [timeLeft, setTimeLeft] = useState(12);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(12);
      setIsComplete(false);
      return;
    }

    if (timeLeft <= 0) {
      setIsComplete(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, timeLeft]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary-900/60 backdrop-blur-sm animate-in fade-in duration-300" dir={isEnglish ? 'ltr' : 'rtl'}>
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col animate-in zoom-in-95 duration-300">

        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold-50 rounded-xl flex items-center justify-center">
              <Download className="w-5 h-5 text-gold-600" />
            </div>
            <div>
              <h3 className="font-bold text-primary-900 leading-tight">
                {isComplete ? t.preparing_download : t.preparing_download_link}
              </h3>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                {isComplete ? 'Ready' : `Waiting ${timeLeft}s...`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 flex flex-col items-center">
          {/* Ad Area */}
          <div className="w-full mb-6">
             <AdBanner />
          </div>

          <div className="w-full space-y-4">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-sm font-bold text-gray-900 line-clamp-2 mb-1">{bookTitle}</p>
              {fileSize && (
                <p className="text-xs text-gray-400">{formatBytes(fileSize)}</p>
              )}
            </div>

            {isComplete ? (
               <button
                onClick={handleStartDownload}
                className="w-full py-4 bg-primary-900 text-gold-200 rounded-2xl font-bold text-lg hover:bg-primary-800 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
               >
                 <CheckCircle2 className="w-6 h-6" />
                 {t.download_now}
               </button>
            ) : (
               <div className="w-full py-4 bg-gray-100 text-gray-400 rounded-2xl font-bold text-lg flex items-center justify-center gap-3">
                  <div className="w-6 h-6 rounded-full border-2 border-gray-300 border-t-primary-900 animate-spin" />
                  <span>{timeLeft}s...</span>
               </div>
            )}

            <p className="text-center text-[11px] text-gray-400 px-4 leading-relaxed">
              {t.dont_close_page}
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-8 py-4 bg-gold-50/50 border-t border-gold-100/50 flex items-center gap-3">
           <Info className="w-4 h-4 text-gold-600 flex-shrink-0" />
           <p className="text-[10px] text-gold-800 font-medium leading-tight">
             {t.did_you_know_desc}
           </p>
        </div>
      </div>
    </div>
  );
}
