'use client';

import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { addToRecentBooks } from '@/lib/recent-books';
import { optimizeArchiveUrl } from '@/lib/archive-utils';
import { getCachedPDF } from '@/lib/pdf-cache';

// CDN for PDF.js
const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

interface PageItemProps {
  pageNumber: number;
  pdf: any;
  scale: number;
  isNightMode: boolean;
  onVisible: (pageNumber: number) => void;
}

function PageItem({ pageNumber, pdf, scale, isNightMode, onVisible }: PageItemProps) {
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
          // Accurate page tracking: We want to trigger when the top of the page is near the top of viewport
          // IntersectionRatio > 0.3 AND top of entry is within upper half of viewport
          const rect = entry.boundingClientRect;
          if (rect.top < window.innerHeight / 2 && rect.bottom > 100) {
             onVisible(pageNumber);
          }

          if (!isRendered && !isRendering) {
            renderPage();
          }
        }
      },
      { threshold: [0.1, 0.4, 0.5], rootMargin: '800px 0px' } // Pre-render when getting close
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [pdf, scale, isRendered, pageNumber, onVisible]);

  const renderPage = async () => {
    if (!pdf || !canvasRef.current || isRendered || isRendering) return;

    try {
      setIsRendering(true);
      const page = await pdf.getPage(pageNumber);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d')!;

      const viewport = page.getViewport({ scale });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      renderTaskRef.current = page.render(renderContext);
      await renderTaskRef.current.promise;
      setIsRendered(true);
    } catch (err: any) {
      if (err.name !== 'RenderingCancelledException') {
        console.error(`Error rendering page ${pageNumber}:`, err);
      }
    } finally {
      setIsRendering(false);
    }
  };

  // Re-render on scale change
  useEffect(() => {
    if (isRendered || isRendering) {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
      setIsRendered(false);
      setIsRendering(false);

      // Delay slightly to avoid rapid re-renders during scale slider movement if we had one
      const timer = setTimeout(() => {
        // Only re-render if still visible
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect && rect.top < window.innerHeight * 2 && rect.bottom > -window.innerHeight) {
          renderPage();
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [scale]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center mb-8 last:mb-0"
      style={{ minHeight: '500px' }}
    >
      <div className={cn(
        "shadow-2xl bg-white transition-all duration-300 relative",
        isNightMode && "brightness-75 contrast-125",
        !isRendered && "flex items-center justify-center bg-gray-50 border border-gray-100"
      )}>
        {!isRendered && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 text-primary-200 animate-spin" />
            <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">{pageNumber}</span>
          </div>
        )}
        <canvas
          ref={canvasRef}
          className={cn(
            "max-w-full h-auto transition-opacity duration-500",
            isRendered ? "opacity-100" : "opacity-0"
          )}
        />
      </div>
      <div className="mt-2 text-xs text-gray-400 font-mono">
        {pageNumber}
      </div>
    </div>
  );
}

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
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [isNightMode, setIsNightMode] = useState(false);
  const [isInitialScrollDone, setIsInitialScrollDone] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize PDF.js and Load Document
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
          document.head.appendChild(script);
        } else {
          initPdf(pdfUrl);
        }
      } catch (err) {
        console.error('Error loading PDF.js:', err);
        setError(t.error_pdf_lib);
        setIsLoading(false);
      }
    };

    const initPdf = async (url: string) => {
      try {
        const pdfjsLib = (window as any).pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;

        const cachedResponse = await getCachedPDF(url);
        let pdfSource: any;

        if (cachedResponse) {
          const blob = await cachedResponse.blob();
          const arrayBuffer = await blob.arrayBuffer();
          pdfSource = { data: arrayBuffer };
        } else {
          const optimizedUrl = optimizeArchiveUrl(url);
          pdfSource = optimizedUrl.includes('archive.org')
            ? `/api/pdf-proxy?url=${encodeURIComponent(optimizedUrl)}`
            : optimizedUrl;
        }

        const loadingTask = pdfjsLib.getDocument(pdfSource);
        const pdfDoc = await loadingTask.promise;
        setPdf(pdfDoc);
        setNumPages(pdfDoc.numPages);

        const savedPage = localStorage.getItem(`page_${url}`);
        if (savedPage) {
          const page = parseInt(savedPage);
          if (page > 0 && page <= pdfDoc.numPages) {
            setPageNum(page);
          }
        } else {
          setPageNum(1);
        }

        addToRecentBooks({
          identifier: url,
          title: bookTitle,
          url: url,
          lastRead: new Date().toISOString(),
          currentPage: parseInt(savedPage || '1'),
          totalPages: pdfDoc.numPages
        });

        setIsLoading(false);
      } catch (err: any) {
        console.error('Error initializing PDF:', err);
        setError(err.message?.includes('404') ? t.error_pdf_404 : t.error_pdf_general);
        setIsLoading(false);
      }
    };

    loadPdf();

    const savedNightMode = localStorage.getItem('nightMode') === 'true';
    setIsNightMode(savedNightMode);
  }, [pdfUrl, bookTitle]);

  // Initial scroll to saved page
  useEffect(() => {
    if (!isLoading && numPages > 0 && pageNum > 1 && !isInitialScrollDone) {
      const timer = setTimeout(() => {
        const pageElement = document.getElementById(`page-${pageNum}`);
        if (pageElement) {
          pageElement.scrollIntoView({ behavior: 'auto', block: 'start' });
          // Use a longer timeout or multiple checks to ensure it actually scrolled
          // Before marking initial scroll as done
          setTimeout(() => setIsInitialScrollDone(true), 500);
        } else {
          // If element not found yet, don't mark as done, it will retry
        }
      }, 800);
      return () => clearTimeout(timer);
    } else if (!isLoading && numPages > 0 && pageNum === 1 && !isInitialScrollDone) {
      setIsInitialScrollDone(true);
    }
  }, [isLoading, numPages, pageNum, isInitialScrollDone]);

  const onPageVisible = useCallback((page: number) => {
    // Only update pageNum and storage IF we have finished the initial positioning
    // OR if the page is different from the target initial page
    if (!isInitialScrollDone) return;

    setPageNum(page);
    if (pdfUrl) {
      localStorage.setItem(`page_${pdfUrl}`, page.toString());
      addToRecentBooks({
        identifier: pdfUrl,
        title: bookTitle,
        url: pdfUrl,
        lastRead: new Date().toISOString(),
        currentPage: page,
        totalPages: numPages
      });
    }
  }, [pdfUrl, bookTitle, numPages, isInitialScrollDone]);

  const toggleNightMode = () => {
    const newMode = !isNightMode;
    setIsNightMode(newMode);
    localStorage.setItem('nightMode', newMode.toString());
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-creamy-50" dir={isEnglish ? 'ltr' : 'rtl'}>
        <Loader2 className="w-12 h-12 text-primary-900 animate-spin mb-4" />
        <p className="text-primary-900 font-bold text-lg animate-pulse">{t.loading_book}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-creamy-50 p-4 text-center" dir={isEnglish ? 'ltr' : 'rtl'}>
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md border border-red-100">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{isEnglish ? 'Sorry, an error occurred' : 'عذراً، حدث خطأ أثناء تحميل الكتاب'}</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="w-full bg-primary-900 text-white font-bold py-3 rounded-xl hover:bg-primary-800 transition-colors"
          >
            {t.back_to_home}
          </button>
          <p className="mt-4 text-xs text-gray-400">{isEnglish ? 'This might be due to security restrictions (CORS) or an invalid link.' : 'قد يكون ذلك بسبب قيود الأمان (CORS) أو رابط غير صالح.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-300",
      isNightMode ? "bg-slate-950 text-slate-200" : "bg-creamy-100 text-slate-900"
    )}>
      {/* Toolbar */}
      <header className={cn(
        "fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 shadow-md backdrop-blur-md",
        isNightMode ? "bg-slate-900/90 border-slate-800" : "bg-white/90 border-slate-200"
      )}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            title={t.back}
          >
            <ArrowRight className={`w-5 h-5 ${isEnglish ? 'rotate-180' : ''}`} />
          </button>
          <h1 className="font-bold text-sm md:text-base truncate max-w-[150px] md:max-w-md" title={bookTitle}>
            {bookTitle}
          </h1>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 shadow-inner">
            <button
              onClick={() => setScale(s => Math.max(0.5, s - 0.2))}
              className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all active:scale-90"
              title={isEnglish ? 'Zoom Out' : 'تصغير'}
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-bold w-10 text-center">{Math.round(scale * 100)}%</span>
            <button
              onClick={() => setScale(s => Math.min(3, s + 0.2))}
              className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all active:scale-90"
              title={isEnglish ? 'Zoom In' : 'تكبير'}
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary-900 text-white rounded-xl text-xs font-black shadow-lg border border-primary-800">
            <span className="min-w-[1.5rem] text-center">{pageNum}</span>
            <span className="opacity-40 text-[10px]">/</span>
            <span className="opacity-70">{numPages}</span>
          </div>

          <button
            onClick={toggleNightMode}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            title={t.night_mode}
          >
            {isNightMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
          </button>

          <a
            href={pdfUrl!}
            download
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            title={t.download_pdf}
          >
            <Download className="w-5 h-5" />
          </a>
        </div>
      </header>

      {/* Reader Body */}
      <main className="pt-24 pb-12 px-4 flex flex-col items-center">
        <div className="w-full max-w-5xl">
          {Array.from({ length: numPages }, (_, i) => (
            <div key={i + 1} id={`page-${i + 1}`}>
              <PageItem
                pageNumber={i + 1}
                pdf={pdf}
                scale={scale}
                isNightMode={isNightMode}
                onVisible={onPageVisible}
              />
            </div>
          ))}
        </div>
      </main>

      {/* Mobile Page Indicator */}
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
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-creamy-50">
        <Loader2 className="w-12 h-12 text-primary-900 animate-spin mb-4" />
        <p className="text-primary-900 font-bold text-lg animate-pulse">Loading...</p>
      </div>
    }>
      <ReaderContent />
    </Suspense>
  );
}
