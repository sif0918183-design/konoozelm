'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Book as BookIcon, Download, Loader2, Layers, BookOpen, Pin, PinOff, CheckCircle2 } from 'lucide-react';
import { slugify } from '@/lib/utils';
import { type Book, type BookFile, getBookFiles } from '@/lib/archive-api';
import { cn } from '@/lib/utils';
import BookPartsDialog from './BookPartsDialog';
import DownloadModal from './DownloadModal';
import { translations } from '@/lib/translations';
import { addToRecentBooks, togglePinBook, updateOfflineStatus, getRecentBooks } from '@/lib/recent-books';
import { cachePDF, uncachePDF, isPDFCached } from '@/lib/pdf-cache';

interface BookCardProps {
  book: Book;
  lang?: 'ar' | 'en';
}

export default function BookCard({ book, lang = 'ar' }: BookCardProps) {
  const t = translations[lang];
  const router = useRouter();
  const [seoSlug, setSeoSlug] = useState<string | null>(null);
  const [files, setFiles] = useState<BookFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showPartsDialog, setShowPartsDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'read' | 'download'>('read');
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<BookFile | null>(null);

  const [isPinned, setIsPinned] = useState(false);
  const [isOfflineReady, setIsOfflineReady] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    const fetchSeoData = async () => {
      try {
        const res = await fetch(`/api/admin/books?archiveId=${book.identifier}&lang=${lang}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.slug) {
            setSeoSlug(data.slug);
          }
        }
      } catch (e) {}
    };

    const fetchFiles = async () => {
      setIsLoadingFiles(true);
      try {
        const bookFiles = await getBookFiles(book.identifier);
        setFiles(bookFiles);

        // Check if already pinned or cached
        const recent = getRecentBooks();
        const firstFileUrl = bookFiles[0]?.url;
        const recentBook = recent.find(b => b.url === firstFileUrl);

        if (recentBook) {
          setIsPinned(!!recentBook.isPinned);
          setIsOfflineReady(!!recentBook.isOfflineAvailable);
        } else if (firstFileUrl) {
          const cached = await isPDFCached(firstFileUrl);
          setIsOfflineReady(cached);
        }

      } catch (error) {
        console.error('Error fetching book files:', error);
      } finally {
        setIsLoadingFiles(false);
      }
    };

    fetchSeoData();
    fetchFiles();
  }, [book.identifier, lang]);

  const handleRead = () => {
    if (files.length > 1) {
      setDialogMode('read');
      setShowPartsDialog(true);
    } else if (files.length === 1) {
      const readerUrl = `/reader?pdf=${encodeURIComponent(files[0].url)}&title=${encodeURIComponent(book.title)}&lang=${lang}`;
      router.push(readerUrl);
    } else {
      if (typeof window !== 'undefined' && !navigator.onLine) {
        alert(t.offline_notice);
      } else if (files.length === 0 && !isLoadingFiles) {
        alert(lang === 'ar' ? 'لايمكن فتح الكتاب بسبب ضعف الإنترنت، يرجى تحديث الصفحة المحاولة مرة أخرى' : 'The book cannot be opened due to weak internet, please refresh the page and try again');
      }
    }
  };

  const handleTogglePin = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (files.length === 0 || isDownloading) return;

    const fileUrl = files[0].url;
    const newPinnedStatus = !isPinned;

    if (newPinnedStatus) {
      // Add to recent if not there
      addToRecentBooks({
        identifier: book.identifier,
        title: book.title,
        url: fileUrl,
        lastRead: new Date().toISOString(),
        currentPage: 1,
        totalPages: 0 // Will be updated when opened
      });

      setIsPinned(true);
      setIsDownloading(true);
      setDownloadProgress(0);

      const success = await cachePDF(fileUrl, (p) => setDownloadProgress(p));

      if (success) {
        updateOfflineStatus(fileUrl, true);
        setIsOfflineReady(true);
        // Page images caching is done in background
        const idMatch = fileUrl.match(/archive\.org\/download\/([^\/]+)/);
        if (idMatch) {
          const { cacheBookImages } = await import('@/lib/pdf-cache');
          cacheBookImages(idMatch[1], 100); // Guessing 100 pages for background cache
        }
      }

      setIsDownloading(false);
    } else {
      await uncachePDF(fileUrl);
      updateOfflineStatus(fileUrl, false);
      setIsPinned(false);
      setIsOfflineReady(false);
    }

    togglePinBook(fileUrl);
  };

  const handleDownload = () => {
    if (files.length > 1) {
      setDialogMode('download');
      setShowPartsDialog(true);
    } else if (files.length === 1) {
      setSelectedFile(files[0]);
      setShowDownloadModal(true);
    }
  };

  const triggerDownload = (file: BookFile) => {
    setSelectedFile(file);
    setShowDownloadModal(true);
  };

  const detailsHref = lang === 'en'
    ? (seoSlug ? `/en/book/${seoSlug}` : `/en/book/${slugify(book.title)}--${book.identifier}`)
    : (seoSlug ? `/book/${seoSlug}` : `/book/${slugify(book.title)}--${book.identifier}`);

  return (
    <div className={`group bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(15,46,34,0.12)] transition-all duration-500 border border-primary-900/5 hover:border-primary-900/20 flex flex-col h-full overflow-hidden relative ${lang === 'en' ? 'text-left' : 'text-right'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Detail Link */}
      <a
        href={detailsHref}
        className="absolute inset-0 z-0 cursor-pointer"
        aria-label="View Details"
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 p-4 sm:p-5">
        <div className="flex flex-row gap-4 mb-4">
          {/* Cover Image Section */}
          <div className="relative w-24 sm:w-28 h-32 sm:h-36 bg-primary-50/50 rounded-xl overflow-hidden flex-shrink-0 border border-primary-900/10 shadow-sm transition-all group-hover:shadow-lg group-hover:-translate-y-1 duration-500">
            {!imageError ? (
              <Image
                src={book.coverImage || `https://archive.org/services/img/${book.identifier}`}
                alt={book.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                onError={() => setImageError(true)}
                unoptimized
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gradient-to-br from-primary-50 to-white">
                <BookIcon className="w-8 sm:w-10 h-8 sm:h-10 text-primary-200" />
              </div>
            )}

            {/* Badges Overlay */}
            <div className="absolute top-2 right-2 flex flex-col gap-1 z-10 pointer-events-none">
              {book.year && (
                <span className="bg-primary-900/90 backdrop-blur-sm text-gold-100 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm border border-white/10">
                  {book.year}
                </span>
              )}
            </div>

            {/* Offline Badge */}
            {isOfflineReady && (
               <div className={`absolute top-2 ${lang === 'ar' ? 'left-2' : 'right-2'} z-10 bg-primary-600 text-white p-1 rounded-full shadow-lg border border-white/20`}>
                <CheckCircle2 className="w-3 h-3" />
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="flex flex-col flex-1 min-w-0 py-1">
            <h3 className="font-bold text-gray-900 mb-2 line-clamp-4 leading-snug text-sm sm:text-base group-hover:text-primary-900 transition-colors" title={book.title}>
              {book.title}
            </h3>

            <div className="space-y-2 mt-auto">
              {book.author && (
                <p className="text-xs text-gray-500 flex items-start gap-1.5" title={book.author}>
                  <span className="line-clamp-2 leading-relaxed font-medium">{book.author}</span>
                </p>
              )}

              {files.length > 1 && (
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gold-50 text-gold-700 text-[10px] font-bold border border-gold-100">
                  <Layers className="w-3 h-3" />
                  <span>{lang === 'ar' ? `متعدد الأجزاء (${files.length})` : `Multi-part (${files.length})`}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Download Progress */}
        {isDownloading && (
          <div className="mb-3 relative z-10">
            <div className="flex items-center justify-between text-[10px] text-primary-700 font-bold mb-1">
              <span>{lang === 'ar' ? 'جاري الحفظ للأوفلاين...' : 'Saving for offline...'}</span>
              <span>{downloadProgress}%</span>
            </div>
            <div className="h-1.5 w-full bg-primary-50 rounded-full overflow-hidden border border-primary-100">
              <div
                className="h-full bg-primary-600 transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons - Always at bottom */}
        <div className="flex flex-row gap-2 relative z-10 mt-auto pt-3 border-t border-gray-50">
          <button
            onClick={handleRead}
            disabled={isLoadingFiles}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300",
              "bg-primary-900 text-white hover:bg-primary-800 hover:shadow-[0_10px_20px_rgba(15,46,34,0.2)] active:scale-95 disabled:opacity-50"
            )}
          >
            {isLoadingFiles ? (
              <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
            ) : (
              <BookOpen className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="whitespace-nowrap">{t.read_now}</span>
          </button>

          <button
            onClick={handleTogglePin}
            disabled={isLoadingFiles || files.length === 0 || isDownloading}
            className={cn(
              "px-3 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300",
              isPinned ? "bg-gold-50 text-gold-600 border-2 border-gold-200" : "bg-white text-gray-400 border-2 border-gray-100 hover:bg-gray-50 active:scale-95 disabled:opacity-50"
            )}
            title={isPinned ? t.unpin : t.pin}
          >
             {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={handleDownload}
            disabled={isLoadingFiles || files.length === 0}
            className={cn(
              "px-3 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300",
              "bg-white text-primary-900 border-2 border-primary-900/10 hover:bg-primary-50 hover:border-primary-900/20 active:scale-95 disabled:opacity-50"
            )}
            title={t.download}
          >
            {isLoadingFiles ? (
              <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
            ) : (
              <Download className="w-4 h-4 flex-shrink-0" />
            )}
          </button>
        </div>
      </div>

      {showPartsDialog && (
        <BookPartsDialog
          book={book}
          files={files}
          mode={dialogMode}
          onClose={() => setShowPartsDialog(false)}
          onDownload={triggerDownload}
        />
      )}

      {showDownloadModal && selectedFile && (
        <DownloadModal
          isOpen={showDownloadModal}
          onClose={() => {
            setShowDownloadModal(false);
            setSelectedFile(null);
          }}
          fileUrl={selectedFile.url}
          fileName={selectedFile.name}
          bookTitle={book.title}
          fileSize={selectedFile.size}
        />
      )}
    </div>
  );
}
