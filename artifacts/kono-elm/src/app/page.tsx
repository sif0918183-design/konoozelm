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

    const startTime = Date.now();

    try {
      const results = await searchBooks(searchQuery, pageNum);
      const searchDurationMs = Date.now() - startTime;
      
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
        await logSearch(searchQuery, results.totalResults, searchDurationMs);
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
    <div className="min-h-screen bg-[#fcfcf8] font-tajawal">
      {/* Header */}
      <header className="bg-primary-900 text-white pt-12 md:pt-20 pb-20 md:pb-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 border-4 border-white/20 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 border-4 border-white/20 rounded-full translate-x-1/3 translate-y-1/3" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-amiri font-bold mb-4 tracking-tight text-gold-200 drop-shadow-sm">
            مُوسُوعَةُ كُنُوزِ العِلْمِ
          </h1>
          <div className="flex flex-col gap-3 mb-10">
            <p className="text-sm md:text-lg text-primary-100/90 font-medium max-w-2xl mx-auto">
              المكتبة الإلكترونية الشاملة للكتب والرسائل والمخطوطات الإسلامية
            </p>
            <div className="inline-flex items-center justify-center gap-2 text-[10px] md:text-xs text-gold-200/80 bg-white/5 py-1.5 px-4 rounded-full self-center border border-white/10 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
              📚 يتم حفظ موضع قراءتك تلقائيًا لتيسير استكمال المطالعة من حيث توقفت
            </div>
          </div>
          
          {/* Search Form */}
          <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto group">
            <div className="relative">
              <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-primary-900/40 w-6 h-6 group-focus-within:text-primary-900 transition-colors" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث بالعنوان، المؤلف، أو الموضوع..."
                className="w-full px-8 py-5 pr-16 text-lg text-gray-900 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl focus:outline-none focus:ring-4 focus:ring-gold-500/30 transition-all border-2 border-transparent focus:border-gold-500/50"
                dir="rtl"
              />
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 bg-primary-900 text-gold-200 hover:text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'بحث'}
              </button>
            </div>
          </form>
        </div>
      </header>

      {/* Results Section */}
      <main className="max-w-7xl mx-auto px-4 -mt-10 relative z-20 pb-20">
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
            <p className="text-white bg-primary-800/40 backdrop-blur-md px-4 py-1.5 rounded-full text-sm border border-white/10">
              {!isLoading && (
                <>
                  تم العثور على <span className="font-bold text-gold-200">{totalResults}</span> كتاب
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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
      <footer className="bg-white border-t border-gray-100 py-12 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="inline-block p-3 bg-primary-50 rounded-2xl mb-4">
            <BookOpen className="w-8 h-8 text-primary-900" />
          </div>
          <p className="text-gray-900 font-bold text-lg mb-2">
            موسوعة كنوز العلم الإلكترونية
          </p>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            مشروع غير ربحي يهدف لتيسير الوصول للكتب الإسلامية القيمة والمخطوطات النادرة من أرشيف المكتبات العالمية.
          </p>
          <div className="mt-8 pt-8 border-t border-gray-50 text-gray-400 text-xs">
            جميع الحقوق محفوظة © {new Date().getFullYear()} - تعتمد على مكتبة Archive.org
          </div>
        </div>
      </footer>
    </div>
  );
}