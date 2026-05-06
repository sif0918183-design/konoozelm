'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Book as BookIcon, Download, Loader2, Layers, BookOpen } from 'lucide-react';
import { slugify } from '@/lib/utils';
import { type Book, type BookFile, getBookFiles } from '@/lib/archive-api';
import { cn } from '@/lib/utils';
import BookPartsDialog from './BookPartsDialog';
import DownloadModal from './DownloadModal';
import { translations } from '@/lib/translations';

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
      // Fallback if no specific files found yet
      window.open(book.previewLink, '_blank');
    }
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
      {/* Detail Link (Internal SEO link) - Only for the card body, excluding buttons */}
      <a
        href={detailsHref}
        className="absolute inset-0 z-0 cursor-pointer"
        aria-label="View Details"
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 p-5 sm:p-6">
        <div className="flex flex-row gap-5 mb-5">
          {/* Cover Image Section */}
          <div className="relative w-28 sm:w-32 h-40 sm:h-44 bg-primary-50/50 rounded-2xl overflow-hidden flex-shrink-0 border border-primary-900/10 shadow-sm transition-all group-hover:shadow-lg group-hover:-translate-y-1 duration-500">
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
                <BookIcon className="w-10 sm:w-12 h-10 sm:h-12 text-primary-200" />
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
          </div>

          {/* Content Section */}
          <div className="flex flex-col flex-1 min-w-0 py-1">
            <h3 className="font-bold text-gray-900 mb-2 line-clamp-3 leading-tight text-base sm:text-lg group-hover:text-primary-900 transition-colors" title={book.title}>
              {book.title}
            </h3>

            <div className="space-y-2 mt-auto">
              {book.author && (
                <p className="text-xs text-gray-500 flex items-start gap-1.5" title={book.author}>
                  <span className="text-primary-900/40 font-bold whitespace-nowrap">{t.author}:</span>
                  <span className="line-clamp-2 leading-relaxed">{book.author}</span>
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

        {/* Action Buttons - Always at bottom */}
        <div className="flex flex-row gap-3 relative z-10 mt-auto pt-4 border-t border-gray-50">
          <button
            onClick={handleRead}
            disabled={isLoadingFiles}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all duration-300",
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
            onClick={handleDownload}
            disabled={isLoadingFiles || files.length === 0}
            className={cn(
              "px-4 py-3.5 rounded-2xl font-bold text-sm transition-all duration-300",
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
