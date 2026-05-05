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
  Book as BookIcon,
  WifiOff,
  CheckCircle2
} from 'lucide-react';
import { getRecentBooks, togglePinBook, removeFromRecent, type RecentBook } from '@/lib/recent-books';
import { cn } from '@/lib/utils';
import { cachePDF, uncachePDF } from '@/lib/pdf-cache';
import { translations } from '@/lib/translations';
import Logo from '@/components/Logo';

export default function EnglishContinueReadingPage() {
  const lang = 'en';
  const t = translations[lang];
  const [books, setBooks] = useState<RecentBook[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setBooks(getRecentBooks());
    setIsLoaded(true);
  }, []);

  const handleTogglePin = async (book: RecentBook) => {
    const newPinnedStatus = !book.isPinned;

    if (newPinnedStatus) {
      await cachePDF(book.url);
    } else {
      await uncachePDF(book.url);
    }

    togglePinBook(book.url);
    setBooks(getRecentBooks());
  };

  const handleRemove = (url: string) => {
    if (confirm(t.confirm_remove_recent)) {
      removeFromRecent(url);
      setBooks(getRecentBooks());
    }
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#fcfcf8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcf8] pb-20">
      {/* Header */}
      <header className="bg-primary-900 text-white pt-12 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 border-4 border-white/20 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 border-4 border-white/20 rounded-full translate-x-1/3 translate-y-1/3" />
        </div>
        <div className="max-w-5xl mx-auto relative z-10 flex flex-col items-center">
          <Link href="/en" className="w-full mb-8 hover:opacity-90 transition-opacity">
            <Logo lang="en" />
          </Link>

          <div className="w-24 h-1 bg-gold-500/50 mx-auto mb-8 rounded-full" />

          <Link
            href="/en"
            className="inline-flex items-center gap-2 text-gold-200 hover:text-white mb-8 transition-colors group self-start"
          >
            <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform rotate-180" />
            <span>{t.back_to_library}</span>
          </Link>

          <h1 className="text-4xl font-bold mb-4 text-gold-200 self-start">{t.history_title}</h1>
          <p className="text-primary-100/80 max-w-2xl">
            {t.history_desc}
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 -mt-10 relative z-20" dir="ltr">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          {/* Search/Filter Bar */}
          <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t.history_search}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
              />
            </div>
            <div className="text-sm text-gray-500 font-medium">
              {t.history_total.replace('{count}', books.length.toString())}
            </div>
          </div>

          {books.length === 0 ? (
            <div className="py-24 text-center">
              <div className="bg-primary-50 inline-flex p-6 rounded-full mb-4 text-primary-200">
                <BookIcon className="w-16 h-16" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{t.history_empty}</h3>
              <p className="text-gray-500 mb-8">{t.history_empty_desc}</p>
              <Link
                href="/en"
                className="bg-primary-900 text-gold-200 px-8 py-3 rounded-xl font-bold hover:bg-primary-800 transition-colors shadow-lg"
              >
                {t.back_to_library}
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredBooks.map((book) => (
                <div
                  key={book.url}
                  className="p-6 hover:bg-gray-50 transition-colors flex flex-col md:flex-row md:items-center gap-6"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex flex-col gap-2 min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/reader?pdf=${encodeURIComponent(book.url)}&title=${encodeURIComponent(book.title)}&lang=en`}
                            className="group min-w-0"
                          >
                            <h2 className="text-lg md:text-xl font-bold text-gray-800 group-hover:text-primary-900 transition-colors truncate">
                              {book.title}
                            </h2>
                          </Link>
                          {book.isPinned && (
                            <div className="bg-primary-600 text-white p-1 rounded-full border-2 border-white shadow-sm flex-shrink-0" title={t.available_offline}>
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        {book.isPinned && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full w-fit mt-1">
                            <WifiOff className="w-3 h-3" />
                            <span>{t.ready_for_offline}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleTogglePin(book)}
                          className={cn(
                            "p-2.5 rounded-xl transition-all border shadow-sm",
                            book.isPinned
                              ? "bg-gold-50 text-gold-600 border-gold-100"
                              : "bg-white text-gray-500 border-gray-100 hover:bg-gray-50 hover:text-primary-600"
                          )}
                          title={book.isPinned ? t.unpin : t.pin}
                        >
                          {book.isPinned ? <PinOff className="w-5 h-5" /> : <Pin className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => handleRemove(book.url)}
                          className="p-2.5 bg-white text-gray-500 border border-gray-100 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm"
                          title={t.remove}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-gray-500 mb-4 mt-2">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>{t.history_last_read.replace('{date}', new Date(book.lastRead).toLocaleDateString('en-US'))}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4" />
                        <span>{t.page_of.replace('{current}', book.currentPage.toString()).replace('{total}', book.totalPages.toString())}</span>
                      </div>
                    </div>

                    <div className="relative pt-1">
                      <div className="flex mb-2 items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary-600 bg-primary-100">
                            {t.completion_rate}
                          </span>
                        </div>
                        <div className="text-right">
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
                      href={`/reader?pdf=${encodeURIComponent(book.url)}&title=${encodeURIComponent(book.title)}&lang=en`}
                      className="inline-flex items-center justify-center gap-2 bg-primary-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-800 transition-all shadow-md active:scale-95 w-full md:w-auto"
                    >
                      {t.history_resume}
                      <BookOpen className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              ))}

              {filteredBooks.length === 0 && books.length > 0 && (
                <div className="py-20 text-center">
                  <Search className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">{t.no_results}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
