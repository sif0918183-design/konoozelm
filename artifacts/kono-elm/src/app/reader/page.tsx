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
  Save
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { addToRecentBooks } from '@/lib/recent-books';
import { optimizeArchiveUrl } from '@/lib/archive-utils';
import { getCachedPDF } from '@/lib/pdf-cache';
import { getBookDetails } from '@/lib/archive-api';

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

const PageItem = memo(function PageItem({ pageNumber, pdf, scale, isNightMode, onVisible }: PageItemProps) {
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
          // Fast Page Detection: Trigger as soon as the page occupies a significant part of the viewport center
          // We use rootMargin to create a narrow detection band in the middle of the screen
          onVisible(pageNumber);

          if (!isRendered && !isRendering) {
            renderPage();
          }
        }
      },
      {
        threshold: 0,
        rootMargin: '-45% 0px -45% 0px' // Only trigger for pages in the middle 10% of the screen
      }
    );

    const renderObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (!isRendered && !isRendering) {
            renderPage();
          }
        }
      },
      { threshold: 0, rootMargin: '1200px 0px' } // Rendering uses a wider margin
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
});

function ReaderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const langParam = searchParams.get('lang');
  const isEnglish = langParam === 'en' || pathname?.startsWith('/en');
  const lang = isEnglish ? 'en' : 'ar';
  const t = translations[lang];

  const [pdfUrl, setPdfUrl] = useState<string | null>(searchParams.get('pdf'));
  const bookId = searchParams.get('id');
  const [fileName, setFileName] = useState<string | null>(searchParams.get('file'));
  const bookTitle = searchParams.get('title') || t.loading;

  const [pdf, setPdf] = useState<any>(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [isNightMode, setIsNightMode] = useState(false);
  const [isInitialScrollDone, setIsInitialScrollDone] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingEmbed, setIsUsingEmbed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [isIframeLoading, setIsIframeLoading] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize PDF.js or Iframe Embed
  useEffect(() => {
    const initReader = async () => {
      try {
        setIsLoading(true);
        setError(null);

        let currentPdfUrl = pdfUrl;
        let currentFileName = fileName;

        // If we have an ID but no PDF URL/Filename, fetch them first for proper persistence and download
        let details = null;
        if (bookId) {
          details = await getBookDetails(bookId);
          if (details) {
            if (details.files && details.files.length > 0 && (!currentPdfUrl || !currentFileName)) {
              currentPdfUrl = details.files[0].url;
              currentFileName = details.files[0].filename;
              setPdfUrl(currentPdfUrl);
              setFileName(currentFileName);
            }
            if (details.totalPages) {
              setNumPages(details.totalPages);
            }
          }
        }

        // 1. Check if we should use PDF.js (Offline/Pinned check)
        const isPinned = currentPdfUrl ? await getCachedPDF(currentPdfUrl) : false;

        if (isPinned && currentPdfUrl) {
          setIsUsingEmbed(false);
          await loadWithPdfJs(currentPdfUrl);
        } else if (bookId) {
          // 2. Use Archive.org Embed directly for better availability
          setIsUsingEmbed(true);

          // Restore saved page
          if (currentPdfUrl) {
            const savedPage = localStorage.getItem(`page_${currentPdfUrl}`);
            if (savedPage) {
              setPageNum(parseInt(savedPage));
            }

            // Progress tracking for embed (basic entry)
            addToRecentBooks({
              identifier: currentPdfUrl,
              title: bookTitle,
              url: currentPdfUrl,
              lastRead: new Date().toISOString(),
              currentPage: parseInt(savedPage || '1'),
              totalPages: (details && details.totalPages) || numPages || 1
            });
          }
          setIsLoading(false);
        } else if (currentPdfUrl) {
          // 3. Fallback to PDF.js if no ID is available
          setIsUsingEmbed(false);
          await loadWithPdfJs(currentPdfUrl);
        } else {
          setError(t.error_no_pdf);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error initializing reader:', err);
        setError(t.error_pdf_general);
        setIsLoading(false);
      }
    };

    const loadWithPdfJs = async (url: string) => {
      if (!(window as any).pdfjsLib) {
        const script = document.createElement('script');
        script.src = PDFJS_CDN;
        script.onload = () => initPdf(url);
        document.head.appendChild(script);
      } else {
        await initPdf(url);
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

    initReader();

    const savedNightMode = localStorage.getItem('nightMode') === 'true';
    setIsNightMode(savedNightMode);
  }, [pdfUrl, bookId, bookTitle, retryKey]);

  // Initial scroll to saved page (only for PDF.js)
  useEffect(() => {
    if (!isUsingEmbed && !isLoading && numPages > 0 && pageNum > 1 && !isInitialScrollDone) {
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

  const lastStorageUpdate = useRef<number>(0);
  const onPageVisible = useCallback((page: number) => {
    if (!isInitialScrollDone) return;

    // Update UI immediately
    setPageNum(page);

    // Throttle storage updates to once every 2 seconds to keep the UI smooth
    const now = Date.now();
    if (pdfUrl && now - lastStorageUpdate.current > 2000) {
      lastStorageUpdate.current = now;
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
        <div className="text-primary-900 font-bold text-xl md:text-2xl text-center px-4 animate-pulse">
          {t.loading_wait}
        </div>
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
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setRetryKey(k => k + 1)}
              className="w-full bg-primary-900 text-white font-bold py-3 rounded-xl hover:bg-primary-800 transition-colors"
            >
              {t.retry_loading}
            </button>
            <button
              onClick={() => router.back()}
              className="w-full bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
            >
              {t.back_to_home}
            </button>
          </div>
          <p className="mt-4 text-xs text-gray-400">{isEnglish ? 'This might be due to server load or an invalid link. Try again.' : 'قد يكون ذلك بسبب ضغط السيرفر أو رابط غير صالح. حاول مرة أخرى.'}</p>
        </div>
      </div>
    );
  }

  const embedUrl = `https://archive.org/embed/${bookId}${fileName ? `?file=${encodeURIComponent(fileName)}` : ''}${pageNum > 1 ? `&page=${pageNum}` : ''}`;

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
          <h1 className="font-bold text-sm md:text-base truncate max-w-[150px] md:max-w-sm" title={bookTitle}>
            {bookTitle}
          </h1>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {isUsingEmbed && (
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl px-2 py-1 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold text-gray-500 uppercase hidden sm:inline">Page</span>
              <input
                type="number"
                min="1"
                max={numPages || 9999}
                value={pageNum}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) setPageNum(val);
                }}
                className="w-12 bg-white dark:bg-slate-900 border-none rounded-lg text-center font-bold text-xs p-1 focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-gray-400 text-[10px]">/ {numPages || '?'}</span>
              <button
                onClick={() => {
                  if (pdfUrl) {
                    localStorage.setItem(`page_${pdfUrl}`, pageNum.toString());
                    addToRecentBooks({
                      identifier: pdfUrl,
                      title: bookTitle,
                      url: pdfUrl,
                      lastRead: new Date().toISOString(),
                      currentPage: pageNum,
                      totalPages: numPages || 1
                    });
                    // Refresh the iframe to jump to new page
                    setRetryKey(k => k + 1);
                  }
                }}
                className="p-1.5 bg-primary-900 text-white rounded-lg hover:bg-primary-800 transition-colors"
                title={isEnglish ? 'Save & Sync' : 'حفظ ومزامنة'}
              >
                <Save className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {!isUsingEmbed && (
            <>
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
            </>
          )}

          <button
            onClick={toggleNightMode}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            title={t.night_mode}
          >
            {isNightMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
          </button>

          {pdfUrl && (
            <a
              href={`/api/download?url=${encodeURIComponent(pdfUrl)}&filename=${encodeURIComponent(fileName || 'book.pdf')}`}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              title={t.download_pdf}
            >
              <Download className="w-5 h-5" />
            </a>
          )}
        </div>
      </header>

      {/* Reader Body */}
      <main className={cn(
        "pt-16",
        isUsingEmbed ? "h-[100dvh] pb-0 px-0 overflow-hidden" : "min-h-screen pb-12 px-4 flex flex-col items-center pt-24"
      )}>
        {isUsingEmbed ? (
          <div className="relative w-full h-full">
            {isIframeLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-creamy-50 z-10">
                <div className="text-primary-900 font-bold text-xl md:text-2xl text-center px-4 animate-pulse">
                  {t.loading_wait}
                </div>
              </div>
            )}
            <iframe
              src={embedUrl}
              width="100%"
              height="100%"
              frameBorder="0"
              allowFullScreen
              onLoad={() => setIsIframeLoading(false)}
              className={cn(
                "w-full h-full",
                isNightMode && "invert brightness-90 hue-rotate-180"
              )}
            />
          </div>
        ) : (
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
        )}
      </main>

      {/* Mobile Page Indicator */}
      {!isUsingEmbed && (
        <div className="fixed bottom-6 right-6 sm:hidden z-50">
          <div className="bg-primary-900 text-white px-4 py-2 rounded-full shadow-2xl font-bold text-sm flex items-center gap-2 border-2 border-white/20 backdrop-blur-sm">
            <span>{pageNum}</span>
            <span className="opacity-50 text-xs">/</span>
            <span className="opacity-80 text-xs">{numPages}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReaderPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-creamy-50">
        <div className="text-primary-900 font-bold text-xl md:text-2xl text-center px-4 animate-pulse">
          جاري تحميل الكتاب، يرجى الانتظار...
        </div>
      </div>
    }>
      <ReaderContent />
    </Suspense>
  );
}
