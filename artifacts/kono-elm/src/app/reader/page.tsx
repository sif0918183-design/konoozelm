'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
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

function ReaderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pdfUrl = searchParams.get('pdf');
  const bookTitle = searchParams.get('title') || 'جاري التحميل...';

  const [pdf, setPdf] = useState<any>(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [isNightMode, setIsNightMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);

  // Initialize PDF.js and Load Document
  useEffect(() => {
    if (!pdfUrl) {
      setError('رابط الكتاب غير موجود');
      setIsLoading(false);
      return;
    }

    const loadPdf = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load PDF.js script dynamically
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
        setError('حدث خطأ أثناء تحميل مكتبة القراءة');
        setIsLoading(false);
      }
    };

    const initPdf = async (url: string) => {
      try {
        const pdfjsLib = (window as any).pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;

        // Try to get from cache first
        const cachedResponse = await getCachedPDF(url);
        let pdfSource: any;

        if (cachedResponse) {
          const blob = await cachedResponse.blob();
          const arrayBuffer = await blob.arrayBuffer();
          pdfSource = { data: arrayBuffer };
        } else {
          // Optimize URL and use the proxy to avoid CORS issues if it's from archive.org
          const optimizedUrl = optimizeArchiveUrl(url);
          pdfSource = optimizedUrl.includes('archive.org')
            ? `/api/pdf-proxy?url=${encodeURIComponent(optimizedUrl)}`
            : optimizedUrl;
        }

        const loadingTask = pdfjsLib.getDocument(pdfSource);
        const pdfDoc = await loadingTask.promise;
        setPdf(pdfDoc);
        setNumPages(pdfDoc.numPages);

        // Restore saved page
        const savedPage = localStorage.getItem(`page_${url}`);
        if (savedPage) {
          const page = parseInt(savedPage);
          if (page > 0 && page <= pdfDoc.numPages) {
            setPageNum(page);
          }
        }

        // Add to recent books
        addToRecentBooks({
          identifier: url, // Use URL as identifier if not provided
          title: bookTitle,
          url: url,
          lastRead: new Date().toISOString(),
          currentPage: parseInt(savedPage || '1'),
          totalPages: pdfDoc.numPages
        });

        setIsLoading(false);
      } catch (err: any) {
        console.error('Error initializing PDF:', err);
        setError(err.message?.includes('404') ? 'الملف غير موجود (404)' : 'حدث خطأ أثناء تحميل الكتاب. قد يكون الرابط غير صالح أو محمي.');
        setIsLoading(false);
      }
    };

    loadPdf();

    // Load Night Mode preference
    const savedNightMode = localStorage.getItem('nightMode') === 'true';
    setIsNightMode(savedNightMode);
  }, [pdfUrl, bookTitle]);

  // Render Page
  useEffect(() => {
    if (!pdf || !canvasRef.current) return;

    const renderPage = async () => {
      if (rendering) return;
      setRendering(true);

      try {
        const page = await pdf.getPage(pageNum);
        const canvas = canvasRef.current!;
        const context = canvas.getContext('2d')!;

        const viewport = page.getViewport({ scale });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Cancel previous render task
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        renderTaskRef.current = page.render(renderContext);
        await renderTaskRef.current.promise;

        // Save current page
        if (pdfUrl) {
          localStorage.setItem(`page_${pdfUrl}`, pageNum.toString());
          // Update recent books progress
          addToRecentBooks({
            identifier: pdfUrl,
            title: bookTitle,
            url: pdfUrl,
            lastRead: new Date().toISOString(),
            currentPage: pageNum,
            totalPages: numPages
          });
        }
      } catch (err: any) {
        if (err.name !== 'RenderingCancelledException') {
          console.error('Error rendering page:', err);
        }
      } finally {
        setRendering(false);
      }
    };

    renderPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdf, pageNum, scale, pdfUrl, bookTitle, numPages]);

  const toggleNightMode = () => {
    const newMode = !isNightMode;
    setIsNightMode(newMode);
    localStorage.setItem('nightMode', newMode.toString());
  };

  const changePage = (offset: number) => {
    const newPage = pageNum + offset;
    if (newPage >= 1 && newPage <= numPages) {
      setPageNum(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-creamy-50">
        <Loader2 className="w-12 h-12 text-primary-900 animate-spin mb-4" />
        <p className="text-primary-900 font-bold text-lg animate-pulse">جاري تحميل الكتاب...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-creamy-50 p-4 text-center">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md border border-red-100">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">عذراً، حدث خطأ أثناء تحميل الكتاب</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="w-full bg-primary-900 text-white font-bold py-3 rounded-xl hover:bg-primary-800 transition-colors"
          >
            العودة للمكتبة
          </button>
          <p className="mt-4 text-xs text-gray-400">قد يكون ذلك بسبب قيود الأمان (CORS) أو رابط غير صالح.</p>
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
            title="رجوع"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-sm md:text-base truncate max-w-[150px] md:max-w-md" title={bookTitle}>
            {bookTitle}
          </h1>
        </div>

        <div className="flex items-center gap-1 md:gap-4">
          {/* Zoom Controls */}
          <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setScale(s => Math.max(0.5, s - 0.2))}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-shadow"
              title="تصغير"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono w-12 text-center">{Math.round(scale * 100)}%</span>
            <button
              onClick={() => setScale(s => Math.min(3, s + 0.2))}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-shadow"
              title="تكبير"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1 md:gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => changePage(-1)}
              disabled={pageNum <= 1}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1 px-2 text-xs md:text-sm font-bold">
              <span>{pageNum}</span>
              <span className="text-slate-400">/</span>
              <span>{numPages}</span>
            </div>
            <button
              onClick={() => changePage(1)}
              disabled={pageNum >= numPages}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={toggleNightMode}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            title="الوضع الليلي"
          >
            {isNightMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
          </button>

          <a
            href={pdfUrl!}
            download
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            title="تحميل PDF"
          >
            <Download className="w-5 h-5" />
          </a>
        </div>
      </header>

      {/* Reader Body */}
      <main className="pt-20 pb-8 flex justify-center">
        <div className={cn(
          "shadow-2xl",
          isNightMode && "brightness-75 contrast-125"
        )}>
          <canvas
            ref={canvasRef}
            className="max-w-full h-auto"
          />
        </div>
      </main>

      {/* Floating Navigation Controls (Mobile) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 md:hidden">
        <button
          onClick={() => changePage(-1)}
          disabled={pageNum <= 1}
          className="bg-primary-900 text-white p-3 rounded-full shadow-lg disabled:opacity-50"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
        <button
          onClick={() => changePage(1)}
          disabled={pageNum >= numPages}
          className="bg-primary-900 text-white p-3 rounded-full shadow-lg disabled:opacity-50"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

export default function ReaderPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-creamy-50">
        <Loader2 className="w-12 h-12 text-primary-900 animate-spin mb-4" />
        <p className="text-primary-900 font-bold text-lg animate-pulse">جاري التحميل...</p>
      </div>
    }>
      <ReaderContent />
    </Suspense>
  );
}
