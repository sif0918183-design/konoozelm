'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Download, Info } from 'lucide-react';
import { cn, optimizeArchiveUrl } from '@/lib/utils';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
  bookTitle: string;
}

export default function DownloadModal({
  isOpen,
  onClose,
  fileUrl,
  fileName,
  bookTitle,
}: DownloadModalProps) {
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
    const link = document.createElement('a');
    link.href = optimizeArchiveUrl(fileUrl);
    // Set the download attribute with the desired filename
    const downloadName = bookTitle.endsWith('.pdf') ? bookTitle : `${bookTitle}.pdf`;
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gold-100 flex flex-col animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-gray-50 bg-primary-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gold-100 flex items-center justify-center">
              <Download className="w-4 h-4 text-gold-700" />
            </div>
            <span className="font-bold text-primary-900 text-sm">تحميل الكتاب</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 flex flex-col items-center text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mb-4 relative">
               <Download className={cn(
                 "w-10 h-10 text-primary-900 transition-all duration-500",
                 isComplete ? "scale-110" : "animate-bounce"
               )} />
               {isComplete && (
                 <div className="absolute inset-0 border-4 border-gold-500 rounded-full animate-ping opacity-20" />
               )}
            </div>
          </div>

          <h3 className="text-xl font-bold text-primary-900 mb-2">
            جارٍ تحضير رابط تحميل الكتاب...
          </h3>
          <p className="text-gray-500 text-sm mb-8 line-clamp-1 max-w-xs">
            {bookTitle}
          </p>

          {/* Progress Bar Container */}
          <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden mb-8 relative shadow-inner">
            <div
              className="h-full bg-gradient-to-l from-primary-900 to-primary-600 transition-all duration-300 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[progress-stripe_1s_linear_infinite]" />
            </div>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-primary-900/40 mix-blend-multiply">
              {Math.round(progress)}%
            </span>
          </div>

          {/* Awareness Message Area */}
          <div className="w-full p-4 rounded-2xl bg-gold-50/50 border border-gold-100/50 flex flex-col gap-2">
            <div className="flex items-center gap-2 justify-center text-gold-700">
              <Info className="w-4 h-4" />
              <span className="text-xs font-bold">تنويه تربوي</span>
            </div>
            <p className="text-sm text-primary-800 italic leading-relaxed">
              &quot;العلم صيد والكتابة قيده.. فقيّد صيودك بالحبال الواثقة. إن من الحماقة أن تصيد غزالة وتتركها بين الخلائق طالقة.&quot;
            </p>
          </div>
        </div>

        <div className="p-4 bg-gray-50 text-center border-t border-gray-100">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-primary-900 font-medium transition-colors"
          >
            إلغاء العملية
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
