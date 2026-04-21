'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { BookOpen, Download, Loader2 } from 'lucide-react';
import { type Book, getPdfDownloadLink } from '@/lib/archive-api';
import { cn } from '@/lib/utils';

interface BookCardProps {
  book: Book;
}

export default function BookCard({ book }: BookCardProps) {
  const [downloadLink, setDownloadLink] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    // Get PDF download link when component mounts
    const fetchPdfLink = async () => {
      setIsLoadingPdf(true);
      try {
        const link = await getPdfDownloadLink(book.identifier);
        setDownloadLink(link);
      } catch (error) {
        console.error('Error fetching PDF link:', error);
      } finally {
        setIsLoadingPdf(false);
      }
    };

    fetchPdfLink();
  }, [book.identifier]);

  const handleReadOnline = () => {
    window.open(book.previewLink, '_blank');
  };

  const handleDownload = () => {
    if (downloadLink) {
      window.open(downloadLink, '_blank');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
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
        
        {/* Year Badge */}
        {book.year && (
          <span className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
            {book.year}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-gray-800 mb-2 line-clamp-2" title={book.title}>
          {book.title}
        </h3>
        
        {book.author && (
          <p className="text-sm text-gray-500 mb-1 truncate" title={book.author}>
            المؤلف: {book.author}
          </p>
        )}

        {book.publisher && (
          <p className="text-xs text-gray-400 truncate mb-3" title={book.publisher}>
            الناشر: {book.publisher}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleReadOnline}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium text-sm",
              "bg-primary-600 text-white hover:bg-primary-700 transition-colors"
            )}
          >
            <BookOpen className="w-4 h-4" />
            قراءة
          </button>
          
          <button
            onClick={handleDownload}
            disabled={isLoadingPdf || !downloadLink}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium text-sm",
              "bg-gold-500 text-white hover:bg-gold-600 transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isLoadingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : downloadLink ? (
              <Download className="w-4 h-4" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            تحميل
          </button>
        </div>
      </div>
    </div>
  );
}