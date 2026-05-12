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
  Search as SearchIcon,
  ChevronUp,
  ChevronDown,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { addToRecentBooks } from '@/lib/recent-books';
import { optimizeArchiveUrl } from '@/lib/archive-utils';
import { getCachedPDF } from '@/lib/pdf-cache';

// CDN for PDF.js
const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const PDFJS_CMAP_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/';

interface PageItemProps {
  pageNumber: number;
  pdf: any;
  scale: number;
  isNightMode: boolean;
  onVisible: (pageNumber: number) => void;
  searchQuery?: string;
}

const PageItem = memo(function PageItem({ pageNumber, pdf, scale, isNightMode, onVisible, searchQuery }: PageItemProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
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
      const textLayerDiv = textLayerRef.current;
      const context = canvas.getContext('2d')!;

      const viewport = page.getViewport({ scale });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      // Render Canvas
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      renderTaskRef.current = page.render(renderContext);
      await renderTaskRef.current.promise;

      // Render Text Layer for Arabic Support and Selection
      if (textLayerDiv) {
        textLayerDiv.innerHTML = '';
        textLayerDiv.style.width = `${viewport.width}px`;
        textLayerDiv.style.height = `${viewport.height}px`;

        const textContent = await page.getTextContent();
        const pdfjsLib = (window as any).pdfjsLib;

        await pdfjsLib.renderTextLayer({
          textContentSource: textContent,
          container: textLayerDiv,
          viewport: viewport,
          enhanceTextSelection: true,
        }).promise;

        if (searchQuery && searchQuery.trim()) {
          const spans = textLayerDiv.querySelectorAll('span');
          // Escape special characters for regex
          const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`(${escapedQuery})`, 'gi');
          spans.forEach(span => {
            const text = span.textContent || "";
            if (regex.test(text)) {
              // Create temporary container to safely build the highlighted HTML
              const temp = document.createElement('div');
              temp.innerHTML = text.replace(regex, '<mark class="highlight">$1</mark>');
              span.innerHTML = temp.innerHTML;
            }
          });
        }
      }

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
  }, [scale, searchQuery]);

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
        <div
          ref={textLayerRef}
          className="textLayer absolute inset-0 opacity-100 pointer-events-none"
          style={{
            lineHeight: 1.0,
          }}
        />
        <style jsx global>{`
          .textLayer {
            position: absolute;
            left: 0;
            top: 0;
            right: 0;
            bottom: 0;
            overflow: hidden;
            opacity: 0.2;
            line-height: 1.0;
            text-align: initial;
            white-space: pre;
          }
          .textLayer span {
            color: transparent;
            position: absolute;
            white-space: pre;
            cursor: text;
            transform-origin: 0% 0%;
          }
          .textLayer .highlight {
            background-color: rgba(255, 255, 0, 0.4);
            border-radius: 4px;
            color: transparent;
          }
        `}</style>
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
  const [useArchiveFallback, setUseArchiveFallback] = useState(false);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [pagesText, setPagesText] = useState<string[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{page: number, index: number}[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  const [showSearch, setShowSearch] = useState(false);

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

        // Extract Archive ID for fallback
        if (url.includes('archive.org')) {
          const match = url.match(/details\/([^\/]+)/) || url.match(/download\/([^\/]+)/);
          if (match && match[1]) {
            setArchiveId(match[1]);
          }
        }

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

        const loadingTask = pdfjsLib.getDocument({
          ...pdfSource,
          cMapUrl: PDFJS_CMAP_URL,
          cMapPacked: true,
        });
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

        // Check if we can fallback to Archive.org Viewer
        if (url.includes('archive.org')) {
          const match = url.match(/details\/([^\/]+)/) || url.match(/download\/([^\/]+)/);
          if (match && match[1]) {
            setArchiveId(match[1]);
            setUseArchiveFallback(true);
            setIsLoading(false);
            return;
          }
        }

        setError(err.message?.includes('404') ? t.error_pdf_404 : t.error_pdf_general);
        setIsLoading(false);
      }
    };

    loadPdf();

    const savedNightMode = localStorage.getItem('nightMode') === 'true';
    setIsNightMode(savedNightMode);
  }, [pdfUrl, bookTitle]);

  // Background Text Extraction
  useEffect(() => {
    if (pdf && numPages > 0 && !isExtracting && pagesText.length === 0) {
      const extractText = async () => {
        setIsExtracting(true);
        const extracted: string[] = new Array(numPages).fill("");

        // Extract sequentially to avoid overwhelming the browser
        for (let i = 1; i <= numPages; i++) {
          try {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const text = textContent.items.map((item: any) => item.str).join(" ");
            extracted[i-1] = text;

            // Periodically update state to show progress or enable search early
            if (i % 20 === 0 || i === numPages) {
              setPagesText([...extracted]);
            }
          } catch (err) {
            console.error(`Error extracting text from page ${i}:`, err);
          }
        }
        setIsExtracting(false);
      };
      extractText();
    }
  }, [pdf, numPages, isExtracting, pagesText.length]);

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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(-1);
      return;
    }

    const results: {page: number, index: number}[] = [];
    pagesText.forEach((text, pageIndex) => {
      if (text.toLowerCase().includes(query.toLowerCase())) {
        results.push({ page: pageIndex + 1, index: results.length });
      }
    });

    setSearchResults(results);
    if (results.length > 0) {
      setCurrentSearchIndex(0);
      scrollToPage(results[0].page);
    } else {
      setCurrentSearchIndex(-1);
    }
  };

  const scrollToPage = (page: number) => {
    const element = document.getElementById(`page-${page}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const nextSearch = () => {
    if (searchResults.length === 0) return;
    const nextIndex = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIndex);
    scrollToPage(searchResults[nextIndex].page);
  };

  const prevSearch = () => {
    if (searchResults.length === 0) return;
    const prevIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentSearchIndex(prevIndex);
    scrollToPage(searchResults[prevIndex].page);
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
    // If error occurs but we have an archiveId, we should have already set useArchiveFallback
    // but just in case of unexpected errors after init
    if (archiveId && !useArchiveFallback) {
      setUseArchiveFallback(true);
      return null; // Next render will show fallback
    }

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

  if (useArchiveFallback && archiveId) {
    return (
      <div className="flex flex-col h-screen bg-slate-900">
        <header className="h-16 flex items-center justify-between px-4 bg-slate-900 text-white shadow-md z-50">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-slate-800 rounded-full transition-colors"
              title={t.back}
            >
              <ArrowRight className={`w-5 h-5 ${isEnglish ? 'rotate-180' : ''}`} />
            </button>
            <h1 className="font-bold text-sm md:text-base truncate max-w-[200px] md:max-w-md">
              {bookTitle}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-gold-500/20 text-gold-400 px-2 py-1 rounded-full font-bold border border-gold-500/30">
              {isEnglish ? 'Archive.org Viewer' : 'مشاهد Archive.org'}
            </span>
          </div>
        </header>
        <div className="flex-1 w-full bg-slate-800">
          <iframe
            src={`https://archive.org/embed/${archiveId}?ui=full`}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            title={bookTitle}
          />
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
          {/* Search Toggle */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={cn(
              "p-2 rounded-full transition-colors",
              showSearch ? "bg-primary-900 text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
            title={isEnglish ? 'Search in book' : 'البحث في الكتاب'}
          >
            <SearchIcon className="w-5 h-5" />
          </button>

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

      {/* Search Bar */}
      {showSearch && (
        <div className={cn(
          "fixed top-16 left-0 right-0 z-40 h-14 flex items-center justify-between px-4 shadow-sm backdrop-blur-md border-t",
          isNightMode ? "bg-slate-900/95 border-slate-800" : "bg-white/95 border-slate-100"
        )}>
          <div className="max-w-4xl mx-auto w-full flex items-center gap-3">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder={isEnglish ? "Search in book..." : "ابحث في الكتاب..."}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className={cn(
                  "w-full pl-10 pr-4 py-2 rounded-xl text-sm outline-none transition-all",
                  isNightMode ? "bg-slate-800 text-white focus:bg-slate-700" : "bg-slate-100 text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary-900/10"
                )}
                dir={isEnglish ? 'ltr' : 'rtl'}
              />
            </div>

            {searchResults.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 min-w-[60px] text-center">
                  {currentSearchIndex + 1} / {searchResults.length}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={prevSearch} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button onClick={nextSearch} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setShowSearch(false);
                setSearchQuery("");
                setSearchResults([]);
              }}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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
                searchQuery={searchQuery}
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
