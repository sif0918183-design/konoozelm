'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Pin, PinOff, Trash2, Clock, ChevronLeft } from 'lucide-react';
import { getRecentBooks, togglePinBook, removeFromRecent, type RecentBook } from '@/lib/recent-books';
import { cn } from '@/lib/utils';

export default function RecentBooks() {
  const [recentBooks, setRecentBooks] = useState<RecentBook[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setRecentBooks(getRecentBooks());
    setIsLoaded(true);
  }, []);

  const handleTogglePin = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    e.stopPropagation();
    togglePinBook(url);
    setRecentBooks(getRecentBooks());
  };

  const handleRemove = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('هل تريد إزالة هذا الكتاب من القائمة؟')) {
      removeFromRecent(url);
      setRecentBooks(getRecentBooks());
    }
  };

  if (!isLoaded || recentBooks.length === 0) return null;

  return (
    <section className="w-full max-w-5xl mx-auto px-4 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Clock className="w-5 h-5 text-primary-900" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">تابع القراءة</h2>
        </div>
        <Link
          href="/continue-reading"
          className="text-sm font-bold text-primary-700 hover:text-primary-900 flex items-center gap-1 transition-colors"
        >
          عرض الكل
          <ChevronLeft className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recentBooks.slice(0, 5).map((book) => (
          <Link
            key={book.url}
            href={`/reader?pdf=${encodeURIComponent(book.url)}&title=${encodeURIComponent(book.title)}`}
            className="group relative bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="p-3 bg-creamy-100 rounded-xl group-hover:bg-primary-50 transition-colors">
                <BookOpen className="w-6 h-6 text-primary-900" />
              </div>
              <div className="flex gap-1">
                <button
                  onClick={(e) => handleTogglePin(e, book.url)}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    book.isPinned ? "text-gold-600 bg-gold-50" : "text-gray-400 hover:bg-gray-100"
                  )}
                  title={book.isPinned ? "إلغاء التثبيت" : "تثبيت"}
                >
                  {book.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                </button>
                <button
                  onClick={(e) => handleRemove(e, book.url)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="إزالة"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-gray-800 line-clamp-1 mb-1 group-hover:text-primary-800 transition-colors">
                {book.title}
              </h3>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>الصفحة {book.currentPage} من {book.totalPages}</span>
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
    </section>
  );
}
