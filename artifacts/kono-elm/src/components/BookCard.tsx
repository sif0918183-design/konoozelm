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
    <div className={`group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100/50 flex flex-col h-full overflow-hidden relative ${lang === 'en' ? 'text-left' : 'text-right'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Detail Link (Internal SEO link) - Only for the card body, excluding buttons */}
      <a
        href={detailsHref}
        className="absolute inset-0 z-0 cursor-pointer"
        aria-label="View Details"
      />
      {/* Cover Image */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        {!imageError ? (
          <Image
            src={book.coverImage || '/placeholder-book.jpg'}
            alt={book.title}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            unoptimized
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-primary-50">
            <BookIcon className="w-16 h-16 text-primary-200" />
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
          {book.year && (
            <span className="bg-white/90 backdrop-blur-sm text-primary-900 text-[10px] font-bold px-2 py-1 rounded-md shadow-sm border border-gray-100">
              {book.year}
            </span>
          )}
          {files.length > 1 && (
            <span className="bg-gold-500 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm flex items-center gap-1">
              <Layers className="w-3 h-3" />
              {lang === 'ar' ? `متعدد الأجزاء (${files.length})` : `Multi-part (${files.length})`}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-gray-800 mb-3 line-clamp-2 leading-snug group-hover:text-primary-800 transition-colors" title={book.title}>
          {book.title}
        </h3>
        
        <div className="space-y-1 mb-4 flex-1">
          {book.author && (
            <p className="text-sm text-gray-600 flex items-center gap-2" title={book.author}>
              <span className="text-gray-400 font-medium">{t.author}:</span>
              <span className="truncate">{book.author}</span>
            </p>
          )}

          {book.publisher && (
            <p className="text-xs text-gray-500 flex items-center gap-2" title={book.publisher}>
              <span className="text-gray-400 font-medium">{lang === 'ar' ? 'الناشر' : 'Publisher'}:</span>
              <span className="truncate">{book.publisher}</span>
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 sm:gap-3 mt-auto relative z-10">
          <button
            onClick={handleRead}
            disabled={isLoadingFiles}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300",
              "bg-primary-900 text-white hover:bg-primary-800 hover:shadow-lg hover:shadow-primary-900/20 active:scale-95 disabled:opacity-50"
            )}
          >
            {isLoadingFiles ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <BookOpen className="w-4 h-4" />
            )}
            <span className="whitespace-nowrap">{t.read_now}</span>
          </button>
          
          <button
            onClick={handleDownload}
            disabled={isLoadingFiles || files.length === 0}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300",
              "bg-gold-50 text-gold-700 border border-gold-200 hover:bg-gold-500 hover:text-white hover:border-gold-500 active:scale-95 disabled:opacity-50"
            )}
          >
            {isLoadingFiles ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span className="whitespace-nowrap">{t.download}</span>
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
