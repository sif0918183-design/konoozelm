'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { BookOpen, Download, Loader2, Layers } from 'lucide-react';
import { slugify } from '@/lib/utils';
import { type Book, type BookFile, getBookFiles } from '@/lib/archive-api';
import { cn } from '@/lib/utils';
import BookPartsDialog from './BookPartsDialog';
import DownloadModal from './DownloadModal';

interface BookCardProps {
  book: Book;
}

export default function BookCard({ book }: BookCardProps) {
  const router = useRouter();
  const [files, setFiles] = useState<BookFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showPartsDialog, setShowPartsDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'read' | 'download'>('read');
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<BookFile | null>(null);

  useEffect(() => {
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

    fetchFiles();
  }, [book.identifier]);

  const handleRead = () => {
    if (files.length > 1) {
      setDialogMode('read');
      setShowPartsDialog(true);
    } else if (files.length === 1) {
      const readerUrl = `/reader?pdf=${encodeURIComponent(files[0].url)}&title=${encodeURIComponent(book.title)}`;
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

  return (
    <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100/50 flex flex-col h-full overflow-hidden">
      {/* Detail Link (Internal SEO link) */}
      <a
        href={`/book/${slugify(book.title)}--${book.identifier}`}
        className="absolute inset-0 z-[5] cursor-pointer"
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
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-primary-100 to-primary-200">
            <BookOpen className="w-16 h-16 text-primary-400" />
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
              متعدد الأجزاء ({files.length})
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
              <span className="text-gray-400 font-medium">المؤلف:</span>
              <span className="truncate">{book.author}</span>
            </p>
          )}

          {book.publisher && (
            <p className="text-xs text-gray-500 flex items-center gap-2" title={book.publisher}>
              <span className="text-gray-400 font-medium">الناشر:</span>
              <span className="truncate">{book.publisher}</span>
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-auto relative z-10">
          <button
            onClick={handleRead}
            disabled={isLoadingFiles}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300",
              "bg-primary-900 text-white hover:bg-primary-800 hover:shadow-lg hover:shadow-primary-900/20 active:scale-95 disabled:opacity-50"
            )}
          >
            {isLoadingFiles ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <BookOpen className="w-4 h-4" />
            )}
            قراءة
          </button>
          
          <button
            onClick={handleDownload}
            disabled={isLoadingFiles || files.length === 0}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300",
              "bg-gold-50 text-gold-700 border border-gold-200 hover:bg-gold-500 hover:text-white hover:border-gold-500 active:scale-95 disabled:opacity-50"
            )}
          >
            {isLoadingFiles ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            تحميل
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
