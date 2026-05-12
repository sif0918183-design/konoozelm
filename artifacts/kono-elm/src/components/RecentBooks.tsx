'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Pin, PinOff, Trash2, Clock, ChevronLeft, WifiOff, CheckCircle2 } from 'lucide-react';
import { getRecentBooks, togglePinBook, removeFromRecent, type RecentBook } from '@/lib/recent-books';
import { cn } from '@/lib/utils';
import { cachePDF, uncachePDF } from '@/lib/pdf-cache';
import { translations } from '@/lib/translations';

interface RecentBooksProps {
  lang?: 'ar' | 'en';
}

export default function RecentBooks({ lang = 'ar' }: RecentBooksProps) {
  const t = translations[lang];
  const [recentBooks, setRecentBooks] = useState<RecentBook[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [showAllMobile, setShowAllMobile] = useState(false);

  useEffect(() => {
    setRecentBooks(getRecentBooks());
    setIsLoaded(true);

    // Offline detection
    setIsOffline(!navigator.onLine);
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const filteredBooks = isOffline
    ? recentBooks.filter(b => b.isPinned)
    : recentBooks;

  // Mobile "Show More" logic
  const itemsToShow = showAllMobile ? 10 : 5;

  const handleTogglePin = async (e: React.MouseEvent, book: RecentBook) => {
    e.preventDefault();
    e.stopPropagation();

    const newPinnedStatus = !book.isPinned;

    if (newPinnedStatus) {
      // Pinning: cache the PDF
      await cachePDF(book.url);
    } else {
      // Unpinning: remove from cache
      await uncachePDF(book.url);
    }

    togglePinBook(book.url);
    setRecentBooks(getRecentBooks());
  };

  const handleRemove = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(t.confirm_remove_recent)) {
      removeFromRecent(url);
      setRecentBooks(getRecentBooks());
    }
  };

  if (!isLoaded || recentBooks.length === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-primary-900 rounded-3xl p-6 md:p-8 shadow-xl border border-white/10 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-gold-500/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/10">
                  <Clock className="w-6 h-6 text-gold-200" />
                </div>
                <h2 className="text-2xl md:text-3xl font-amiri font-bold text-white">{t.continue_reading}</h2>
              </div>
              <p className="text-primary-100/70 text-sm md:text-base mr-12">
                {t.offline_notice}
              </p>
              <p className="text-gold-200/90 text-xs font-bold mr-12 mt-1">
                {t.pin_offline_hint}
              </p>
            </div>
            <Link
              href={lang === 'en' ? "/en/continue-reading" : "/continue-reading"}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl text-gold-200 font-bold transition-all hover:scale-105"
            >
              {t.view_full_history}
              <ChevronLeft className={cn("w-5 h-5", lang === 'en' && "rotate-180")} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBooks.slice(0, 10).map((book, index) => (
          <Link
            key={book.url}
            href={`/reader?pdf=${encodeURIComponent(book.url)}&title=${encodeURIComponent(book.title)}&lang=${lang}${book.url.includes('archive.org/download/') ? `&id=${book.url.split('archive.org/download/')[1].split('/')[0]}&file=${book.url.split('/').pop()}` : ''}`}
            className={cn(
              "group relative bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-3",
              index >= itemsToShow ? "hidden md:flex" : "flex"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="relative">
                <div className="p-3 bg-creamy-100 rounded-xl group-hover:bg-primary-50 transition-colors">
                  <BookOpen className="w-6 h-6 text-primary-900" />
                </div>
                {book.isPinned && (
                  <div className={`absolute -top-2 ${lang === 'ar' ? '-right-2' : '-left-2'} bg-primary-600 text-white p-1 rounded-full border-2 border-white shadow-sm`} title={lang === 'ar' ? 'متوفر بدون اتصال' : 'Available offline'}>
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                )}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={(e) => handleTogglePin(e, book)}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    book.isPinned ? "text-gold-600 bg-gold-50" : "text-gray-400 hover:bg-gray-100"
                  )}
                  title={book.isPinned ? (lang === 'ar' ? "إلغاء التثبيت" : "Unpin") : (lang === 'ar' ? "تثبيت" : "Pin")}
                >
                  {book.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                </button>
                <button
                  onClick={(e) => handleRemove(e, book.url)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title={lang === 'ar' ? "إزالة" : "Remove"}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-gray-800 line-clamp-1 mb-1 group-hover:text-primary-800 transition-colors">
                {book.title}
              </h3>
              {book.isPinned && (
                <div className="flex items-center gap-1 text-[10px] font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full w-fit mb-2">
                  <WifiOff className="w-3 h-3" />
                  <span>{lang === 'ar' ? 'جاهز للقراءة بدون إنترنت' : 'Ready for offline reading'}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-gray-500" dir="ltr">
                <span>{lang === 'ar' ? `الصفحة ${book.currentPage} من ${book.totalPages}` : `Page ${book.currentPage} of ${book.totalPages}`}</span>
                <span>{Math.round((book.currentPage / book.totalPages) * 100)}%</span>
              </div>
              <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-600 transition-all duration-500"
                  style={{ width: `${(book.currentPage / book.totalPages) * 100}%` }}
                />
              </div>
            </div>
          </Link>
        ))}
          </div>

          {filteredBooks.length > 5 && !showAllMobile && (
            <div className="mt-8 text-center md:hidden">
              <button
                onClick={() => setShowAllMobile(true)}
                className="px-8 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-xl text-white font-bold transition-all"
              >
                {t.show_more}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
