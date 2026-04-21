'use client';

import { useState, useCallback } from 'react';
import { Search, BookOpen, Download, Loader2, AlertCircle } from 'lucide-react';
import { searchBooks, type Book } from '@/lib/archive-api';
import { logSearch } from '@/lib/supabase';
import BookCard from '@/components/BookCard';
import SearchSkeleton from '@/components/SearchSkeleton';

export default function Home() {
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const handleSearch = useCallback(async (searchQuery: string, pageNum: number = 1) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);
    
    if (pageNum === 1) {
      setBooks([]);
    }

    try {
      const results = await searchBooks(searchQuery, pageNum);
      
      if (pageNum === 1) {
        setBooks(results.books);
      } else {
        setBooks(prev => [...prev, ...results.books]);
      }
      
      setTotalResults(results.totalResults);
      setHasMore(results.hasMore);
      setPage(results.page);
      setHasSearched(true);

      // Log search to Supabase
      if (pageNum === 1) {
        await logSearch(searchQuery, results.totalResults);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في البحث');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      handleSearch(query, page + 1);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary-800 to-primary-700 text-white py-12 px-4 shadow-lg">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gold-100">
            موسوعة كنوز العلم الإلكترونية
          </h1>
          <p className="text-lg md:text-xl text-primary-100 mb-8">
            اكتشف وحمل الكتب الإسلامية من مكتبة Archive.org الشاملة
          </p>
          
          {/* Search Form */}
          <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث عن كتاب..."
                className="w-full px-6 py-4 pr-14 text-lg text-gray-800 bg-white rounded-full shadow-lg focus:outline-none focus:ring-4 focus:ring-gold-400/50 transition-all"
                dir="rtl"
              />
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-gold-500 to-gold-600 text-white px-6 py-2 rounded-full font-medium hover:from-gold-600 hover:to-gold-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                بحث
              </button>
            </div>
          </form>
        </div>
      </header>

      {/* Results Section */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Results Info */}
        {hasSearched && !error && (
          <div className="mb-6 flex items-center justify-between">
            <p className="text-gray-600">
              {!isLoading && (
                <>
                  تم العثور على <span className="font-bold text-primary-700">{totalResults}</span> كتاب
                </>
              )}
            </p>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && books.length === 0 && (
          <SearchSkeleton />
        )}

        {/* Books Grid */}
        {books.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {books.map((book) => (
              <BookCard key={book.identifier} book={book} />
            ))}
          </div>
        )}

        {/* No Results */}
        {hasSearched && !isLoading && books.length === 0 && !error && (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">لم يتم العثور على نتائج</p>
            <p className="text-gray-400">جرب البحث بكلمة أخرى</p>
          </div>
        )}

        {/* Load More */}
        {hasMore && !isLoading && (
          <div className="text-center mt-8">
            <button
              onClick={handleLoadMore}
              className="bg-primary-600 text-white px-8 py-3 rounded-full font-medium hover:bg-primary-700 transition-all"
            >
              تحميل المزيد
            </button>
          </div>
        )}

        {/* Loading More Indicator */}
        {isLoading && books.length > 0 && (
          <div className="flex justify-center mt-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        )}

        {/* Initial State */}
        {!hasSearched && !isLoading && (
          <div className="text-center py-16">
            <div className="bg-primary-50 inline-flex p-4 rounded-full mb-4">
              <Search className="w-12 h-12 text-primary-400" />
            </div>
            <p className="text-gray-500 text-lg">ابحث في مكتبتنا الإسلامية</p>
            <p className="text-gray-400 mt-2">اكتب اسم الكتاب أو المؤلف للبدء</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-primary-900 text-primary-100 py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm">
            موسوعة كنوز العلم الإلكترونية - تعتمد على مكتبة Archive.org
          </p>
        </div>
      </footer>
    </div>
  );
}