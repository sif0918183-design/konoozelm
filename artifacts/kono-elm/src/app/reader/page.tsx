'use client';

import { useState, useEffect, useRef, Suspense, useCallback, memo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { translations } from '@/lib/translations';
import {
  ZoomIn,
  ZoomOut,
  Moon,
  Sun,
  ArrowRight,
  Download,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { addToRecentBooks } from '@/lib/recent-books';
import { optimizeArchiveUrl } from '@/lib/archive-utils';
import { getCachedPDF } from '@/lib/pdf-cache';

const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

interface PageItemProps {
  pageNumber: number;
  pdf: any;
  identifier: string | null;
  scale: number;
  isNightMode: boolean;
  onVisible: (pageNumber: number) => void;
}

const PageItem = memo(function PageItem({ pageNumber, pdf, identifier, scale, isNightMode, onVisible }: PageItemProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRendered, setIsRendered] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          onVisible(pageNumber);
          if (!isRendered && !isRendering) renderPage();
        }
      },
      { threshold: 0, rootMargin: '-45% 0px -45% 0px' }
    );

    const renderObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (!isRendered && !isRendering) renderPage();
        }
      },
      { threshold: 0, rootMargin: '1200px 0px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
      renderObserver.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
      renderObserver.disconnect();
    };
  }, [pdf, scale, isRendered, pageNumber, onVisible]);

  const renderPage = async () => {
    if (isRendered || isRendering) return;
    if (identifier) { setIsRendering(true); return; }
    if (!pdf || !canvasRef.current) return;

    try {
      setIsRendering(true);
      const page = await pdf.getPage(pageNumber);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d')!;
      const viewport = page.getViewport({ scale });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (renderTaskRef.current) renderTaskRef.current.cancel();
      renderTaskRef.current = page.render({ canvasContext: context, viewport });
      await renderTaskRef.current.promise;
      setIsRendered(true);
    } catch (err: any) {
      if (err.name !== 'RenderingCancelledException') console.error(`Error rendering page ${pageNumber}:`, err);
    } finally {
      setIsRendering(false);
    }
  };

  useEffect(() => {
    if (!identifier && (isRendered || isRendering)) {
      if (renderTaskRef.current) renderTaskRef.current.cancel();
      setIsRendered(false);
      setIsRendering(false);
      const timer = setTimeout(() => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect && rect.top < window.innerHeight * 2 && rect.bottom > -window.innerHeight) renderPage();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [scale, identifier]);

  const imageUrl = identifier ? `https://archive.org/download/${identifier}/page/n${pageNumber - 1}.jpg` : null;

  return (
    <div ref={containerRef} className="flex flex-col items-center mb-8 last:mb-0" style={{ minHeight: '500px' }}>
      <div className={cn("shadow-2xl bg-white transition-all duration-300 relative overflow-hidden", isNightMode && "brightness-75 contrast-125", !isRendered && "flex items-center justify-center bg-gray-50 border border-gray-100")} style={{ width: identifier ? `${600 * scale}px` : 'auto', maxWidth: '95vw', aspectRatio: identifier ? '1/1.4' : 'auto' }}>
        {!isRendered && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 text-primary-200 animate-spin" />
            <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">{pageNumber}</span>
          </div>
        )}
        {identifier ? (
          (isRendering || isRendered) && (
            <img
              src={imageUrl!}
              alt={`Page ${pageNumber}`}
              className={cn("w-full h-full object-contain transition-opacity duration-500", isRendered ? "opacity-100" : "opacity-0")}
              onLoad={() => { setIsRendered(true); setIsRendering(false); }}
              onError={() => { setIsRendering(false); setIsRendered(false); }}
              loading="lazy"
            />
          )
        ) : (
          <canvas ref={canvasRef} className={cn("max-w-full h-auto transition-opacity duration-500", isRendered ? "opacity-100" : "opacity-0")} />
        )}
      </div>
      <div className="mt-2 text-xs text-gray-400 font-mono">{pageNumber}</div>
    </div>
  );
});

function ReaderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const langParam = searchParams.get('lang');
  const isEnglish = langParam === 'en' || pathname?.startsWith('/en');
  const lang = isEnglish ? 'en' : 'ar';
  const t = translations[lang];

  const pdfUrl = searchParams.get('pdf');
  const bookTitle = searchParams.get('title') || t.loading;

  const [pdf, setPdf] = useState<any>(null);
  const [identifier, setIdentifier] = useState<string | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [isNightMode, setIsNightMode] = useState(false);
  const [isInitialScrollDone, setIsInitialScrollDone] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);

  useEffect(() => {
    if (!pdfUrl) {
      setError(t.error_no_pdf);
      setIsLoading(false);
      return;
    }

    const loadPdf = async () => {
      try {
        setIsLoading(true);
        setError(null);
        if (!(window as any).pdfjsLib) {
          const script = document.createElement('script');
          script.src = PDFJS_CDN;
          script.onload = () => initPdf(pdfUrl);
          script.onerror = () => initPdf(pdfUrl);
          document.head.appendChild(script);
        } else {
          initPdf(pdfUrl);
        }
      } catch (err) {
        setError(t.error_pdf_lib);
        setIsLoading(false);
      }
    };

    const initPdf = async (url: string) => {
      let bookIdentifier = null;
      const idMatches = [url.match(/archive\.org\/download\/([^\/]+)/), url.match(/archive\.org\/details\/([^\/]+)/)];
      for (const m of idMatches) { if (m && m[1]) { bookIdentifier = m[1]; break; } }
      setIdentifier(bookIdentifier);

      try {
        const pdfjsLib = (window as any).pdfjsLib;
        if (!pdfjsLib) throw new Error('PDF.js not loaded');
        pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;

        const cachedResponse = await getCachedPDF(url);
        let pdfSource: any;

        if (cachedResponse) {
          const ab = await (await cachedResponse.blob()).arrayBuffer();
          pdfSource = { data: ab };
        } else {
          const optUrl = optimizeArchiveUrl(url);
          if (optUrl.includes('archive.org')) {
             // Retry Strategy:
             // 0: Try discovery via archiveId (Best for mixed names)
             // 1: Try manual URL proxy (Best if discovery fails but URL is valid)
             if (retryAttempt === 0 && bookIdentifier) {
                pdfSource = `/api/pdf-proxy?archiveId=${bookIdentifier}`;
             } else {
                pdfSource = `/api/pdf-proxy?url=${encodeURIComponent(optUrl)}`;
             }
          } else {
            pdfSource = optUrl;
          }
        }

        const task = pdfjsLib.getDocument({
          ...(typeof pdfSource === 'string' ? { url: pdfSource } : pdfSource),
          cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
          cMapPacked: true,
          standardFontDataUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/standard_fonts/',
        });

        const doc = await task.promise;
        setPdf(doc);
        setNumPages(doc.numPages);
        const saved = localStorage.getItem(`page_${url}`);
        setPageNum(saved ? parseInt(saved) : 1);
        setIsLoading(false);
      } catch (err: any) {
        console.error(`Attempt ${retryAttempt} failed:`, err);
        if (retryAttempt < 1) {
          setRetryAttempt(a => a + 1);
        } else {
          let errorMsg = err.message || t.error_pdf_general;
          if (err.message?.includes('404')) errorMsg = t.error_file_not_found;
          else if (err.message?.includes('502')) errorMsg = t.error_upstream;
          else if (err.message?.includes('Metadata')) errorMsg = t.error_upstream;

          setError(errorMsg);
          setIsLoading(false);
        }
      }
    };

    loadPdf();
    setIsNightMode(localStorage.getItem('nightMode') === 'true');
  }, [pdfUrl, bookTitle, t, retryAttempt, isEnglish]);

  useEffect(() => {
    if (!isLoading && numPages > 0 && !isInitialScrollDone) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`page-${pageNum}`);
        if (el) { el.scrollIntoView({ behavior: 'auto', block: 'start' }); setTimeout(() => setIsInitialScrollDone(true), 500); }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isLoading, numPages, pageNum, isInitialScrollDone]);

  const lastStorageUpdate = useRef<number>(0);
  const onPageVisible = useCallback((page: number) => {
    if (!isInitialScrollDone) return;
    setPageNum(page);
    const now = Date.now();
    if (pdfUrl && now - lastStorageUpdate.current > 2000) {
      lastStorageUpdate.current = now;
      localStorage.setItem(`page_${pdfUrl}`, page.toString());
      addToRecentBooks({ identifier: pdfUrl, title: bookTitle, url: pdfUrl, lastRead: new Date().toISOString(), currentPage: page, totalPages: numPages });
    }
  }, [pdfUrl, bookTitle, numPages, isInitialScrollDone]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-creamy-50" dir={isEnglish ? 'ltr' : 'rtl'}>
        <Loader2 className="w-12 h-12 text-primary-900 animate-spin mb-4" />
        <p className="text-primary-900 font-bold text-lg animate-pulse">{t.loading_book}</p>
        {retryAttempt > 0 && <p className="text-primary-900/60 text-xs mt-2">{isEnglish ? `Retrying with discovery mode...` : `جاري إعادة المحاولة بنمط الاكتشاف...`}</p>}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-creamy-50 p-4 text-center" dir={isEnglish ? 'ltr' : 'rtl'}>
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md border border-red-100">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{isEnglish ? 'Critical Load Error' : 'خطأ فادح في التحميل'}</h2>
          <p className="text-gray-600 mb-6 font-mono text-sm">{error}</p>
          <div className="flex flex-col gap-3">
            <button onClick={() => { setRetryAttempt(0); setError(null); setIsLoading(true); }} className="w-full bg-primary-900 text-white font-bold py-3 rounded-xl hover:bg-primary-800 transition-colors flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4" />
              {t.retry}
            </button>
            <button onClick={() => router.back()} className="w-full bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors">
              {t.back_to_home}
            </button>
          </div>
          <p className="mt-4 text-xs text-gray-400">{t.security_restriction_msg}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen transition-colors duration-300", isNightMode ? "bg-slate-950 text-slate-200" : "bg-creamy-100 text-slate-900")}>
      <header className={cn("fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 shadow-md backdrop-blur-md", isNightMode ? "bg-slate-900/90 border-slate-800" : "bg-white/90 border-slate-200")}>
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors" title={t.back}>
            <ArrowRight className={`w-5 h-5 ${isEnglish ? 'rotate-180' : ''}`} />
          </button>
          <h1 className="font-bold text-sm md:text-base truncate max-w-[150px] md:max-w-md" title={bookTitle}>{bookTitle}</h1>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 shadow-inner">
            <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all active:scale-90" title={isEnglish ? 'Zoom Out' : 'تصغير'}><ZoomOut className="w-4 h-4" /></button>
            <span className="text-[11px] font-bold w-10 text-center">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.min(3, s + 0.2))} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all active:scale-90" title={isEnglish ? 'Zoom In' : 'تكبير'}><ZoomIn className="w-4 h-4" /></button>
          </div>
          <button onClick={() => { setIsNightMode(!isNightMode); localStorage.setItem('nightMode', (!isNightMode).toString()); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors" title={t.night_mode}>{isNightMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}</button>
          <a href={`/api/pdf-proxy?archiveId=${identifier || ''}&url=${encodeURIComponent(pdfUrl || '')}`} download className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors" title={t.download_pdf}><Download className="w-5 h-5" /></a>
        </div>
      </header>
      <main className="pt-24 pb-12 px-4 flex flex-col items-center">
        <div className="w-full max-w-5xl">
          {Array.from({ length: numPages }, (_, i) => (
            <div key={i + 1} id={`page-${i + 1}`}>
              <PageItem pageNumber={i + 1} pdf={pdf} identifier={identifier} scale={scale} isNightMode={isNightMode} onVisible={onPageVisible} />
            </div>
          ))}
        </div>
      </main>
      <div className="fixed bottom-6 right-6 sm:hidden z-50">
        <div className="bg-primary-900 text-white px-4 py-2 rounded-full shadow-2xl font-bold text-sm flex items-center gap-2 border-2 border-white/20 backdrop-blur-sm">
          <span>{pageNum}</span>
          <span className="opacity-50 text-xs">/</span>
          <span className="opacity-80 text-xs">{numPages}</span>
        </div>
      </div>
    </div>
  );
}

export default function ReaderPage() {
  return (
    <Suspense fallback={<div className="flex flex-col items-center justify-center min-h-screen bg-creamy-50"><Loader2 className="w-12 h-12 text-primary-900 animate-spin mb-4" /><p className="text-primary-900 font-bold text-lg animate-pulse">Loading...</p></div>}>
      <ReaderContent />
    </Suspense>
  );
}
