'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Pin,
  PinOff,
  Trash2,
  Clock,
  ArrowRight,
  Search,
  Book as BookIcon
} from 'lucide-react';
import { getRecentBooks, togglePinBook, removeFromRecent, type RecentBook } from '@/lib/recent-books';
import { cn } from '@/lib/utils';

export default function ContinueReadingPage() {
  const [books, setBooks] = useState<RecentBook[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setBooks(getRecentBooks());
    setIsLoaded(true);
  }, []);

  const handleTogglePin = (url: string) => {
    togglePinBook(url);
    setBooks(getRecentBooks());
  };

  const handleRemove = (url: string) => {
    if (confirm('هل تريد إزالة هذا الكتاب من قائمة القراءة؟')) {
      removeFromRecent(url);
      setBooks(getRecentBooks());
    }
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-creamy-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-creamy-50 font-tajawal pb-20">
      {/* Header */}
      <header className="bg-primary-900 text-white pt-12 pb-20 px-4 relative overflow-hidden">
        <div className="max-w-5xl mx-auto relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gold-200 hover:text-white mb-8 transition-colors group"
          >
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            <span>العودة للمكتبة</span>
          </Link>

          <h1 className="text-4xl font-amiri font-bold mb-4">قائمة القراءة</h1>
          <p className="text-primary-100/80 max-w-2xl">
            هنا تجد جميع الكتب التي بدأت قراءتها، مع حفظ تلقائي لآخر صفحة توقفت عندها.
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 -mt-10 relative z-20">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          {/* Search/Filter Bar */}
          <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-96">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث في قائمتك..."
                className="w-full pr-10 pl-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
                dir="rtl"
              />
            </div>
            <div className="text-sm text-gray-500 font-medium">
              إجمالي الكتب: <span className="text-primary-900">{books.length}</span>
            </div>
          </div>

          {books.length === 0 ? (
            <div className="py-24 text-center">
              <div className="bg-primary-50 inline-flex p-6 rounded-full mb-4 text-primary-200">
                <BookIcon className="w-16 h-16" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">قائمتك فارغة حالياً</h3>
              <p className="text-gray-500 mb-8">ابدأ بقراءة أي كتاب من المكتبة وسيظهر هنا تلقائياً.</p>
              <Link
                href="/"
                className="bg-primary-900 text-gold-200 px-8 py-3 rounded-xl font-bold hover:bg-primary-800 transition-colors shadow-lg"
              >
                تصفح المكتبة
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredBooks.map((book) => (
                <div
                  key={book.url}
                  className="p-6 hover:bg-gray-50 transition-colors flex flex-col md:flex-row md:items-center gap-6"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <Link
                        href={`/reader?pdf=${encodeURIComponent(book.url)}&title=${encodeURIComponent(book.title)}`}
                        className="group"
                      >
                        <h2 className="text-xl font-bold text-gray-800 group-hover:text-primary-900 transition-colors truncate">
                          {book.title}
                        </h2>
                      </Link>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTogglePin(book.url)}
                          className={cn(
                            "p-2 rounded-xl transition-all",
                            book.isPinned ? "bg-gold-50 text-gold-600 border border-gold-100 shadow-sm" : "text-gray-400 hover:bg-gray-100"
                          )}
                          title={book.isPinned ? "إلغاء التثبيت" : "تثبيت في القائمة الرئيسية"}
                        >
                          {book.isPinned ? <PinOff className="w-5 h-5" /> : <Pin className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => handleRemove(book.url)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="إزالة من القائمة"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>آخر قراءة: {new Date(book.lastRead).toLocaleDateString('ar-SA')}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4" />
                        <span>الصفحة {book.currentPage} من {book.totalPages}</span>
                      </div>
                    </div>

                    <div className="relative pt-1">
                      <div className="flex mb-2 items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary-600 bg-primary-100">
                            نسبة الإنجاز
                          </span>
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-semibold inline-block text-primary-600">
                            {Math.round((book.currentPage / book.totalPages) * 100)}%
                          </span>
                        </div>
                      </div>
                      <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-primary-100">
                        <div
                          style={{ width: `${(book.currentPage / book.totalPages) * 100}%` }}
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-600 transition-all duration-1000"
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <Link
                      href={`/reader?pdf=${encodeURIComponent(book.url)}&title=${encodeURIComponent(book.title)}`}
                      className="inline-flex items-center justify-center gap-2 bg-primary-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-800 transition-all shadow-md active:scale-95 w-full md:w-auto"
                    >
                      استكمال القراءة
                      <BookOpen className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              ))}

              {filteredBooks.length === 0 && books.length > 0 && (
                <div className="py-20 text-center">
                  <Search className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">لا توجد نتائج تطابق بحثك</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
