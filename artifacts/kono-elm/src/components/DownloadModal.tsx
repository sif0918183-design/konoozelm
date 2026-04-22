'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Download, Info } from 'lucide-react';
import { cn, optimizeArchiveUrl, formatBytes } from '@/lib/utils';

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#fcfcf8]/90 backdrop-blur-md animate-in fade-in duration-500">
      <div className="bg-white rounded-[2rem] shadow-[0_32px_64px_-12px_rgba(21,71,52,0.15)] w-full max-w-5xl min-h-[70vh] overflow-hidden border border-gold-100 flex flex-col md:flex-row animate-in slide-in-from-bottom-8 duration-700">

        {/* Left side: Advertising/Awareness Area */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-primary-900 to-primary-800 p-8 md:p-12 text-white flex flex-col justify-center relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/20 border border-gold-500/30 text-gold-200 text-xs font-bold mb-6">
              <Info className="w-4 h-4" />
              تنويه تربوي وقيمة معرفية
            </div>

            <h2 className="text-3xl md:text-4xl font-black mb-6 text-gold-100 leading-tight">
              العلم صيدٌ <br/> والكتابةُ قيدُه
            </h2>

            <div className="space-y-6 text-primary-50/90 leading-relaxed text-lg italic">
              <p>
                &quot;قيّد صيودك بالحبال الواثقة.. إن من الحماقة أن تصيد غزالة وتتركها بين الخلائق طالقة.&quot;
              </p>
              <p className="text-base not-italic text-primary-200 border-r-4 border-gold-500 pr-4">
                ندعوك لاستثمار هذا الوقت في تأمل فضل العلم، ونشجعك على تدوين فوائد هذا الكتاب ونشرها لتعم المنفعة.
              </p>
            </div>

            {/* Placeholder for actual advertisement or extra message */}
            <div className="mt-12 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <p className="text-sm font-medium text-gold-200 mb-2">هل تعلم؟</p>
              <p className="text-sm text-white/70">
                موسوعة كنوز العلم تخدم آلاف الباحثين شهرياً، مساهمتك في نشر رابط الموقع تدعم استمرار هذا العطاء العلمي.
              </p>
            </div>
          </div>
        </div>

        {/* Right side: Download Process */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col items-center justify-center bg-white relative">
          <button
            onClick={onClose}
            className="absolute top-6 left-6 p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
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
              جارٍ تحضير الكتاب للتحميل
            </h3>
            <p className="text-gray-500 text-center mb-10 font-medium leading-relaxed">
              {bookTitle}
            </p>

            {/* Progress Section */}
            <div className="w-full space-y-4 mb-10">
              <div className="flex justify-between items-end mb-2">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-primary-700">نسبة التحضير</span>
                  {fileSize && (
                    <span className="text-[10px] text-gray-400 font-medium" dir="rtl">
                      {formatBytes((Number(fileSize) * progress) / 100)} من {formatBytes(fileSize)}
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
                {isComplete ? 'اكتمل التحضير، سيبدأ التحميل الآن...' : 'يرجى عدم إغلاق هذه الصفحة حتى يكتمل الشريط'}
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-4 rounded-2xl border-2 border-gray-100 text-gray-500 font-bold hover:bg-gray-50 hover:text-red-600 hover:border-red-100 transition-all duration-300"
            >
              إلغاء العملية والعودة
            </button>
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
