'use client';

import { useState, useCallback } from 'react';
import { Search, BookOpen, Download, Loader2, AlertCircle, Activity, Clock, History } from 'lucide-react';
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
      <header className="pt-20 pb-12 px-4 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight text-primary-900">
            موسوعة كنوز العلم
          </h1>
          <p className="text-lg md:text-xl text-primary-700/70 mb-2 font-medium">
            المكتبة الإلكترونية الشاملة للكتب والرسائل والمخطوطات الإسلامية
          </p>
          <p className="text-sm md:text-base text-primary-600/60 mb-10 font-bold flex items-center justify-center gap-2">
            <span>📚</span>
            يتم حفظ موضع قراءتك تلقائيًا لتيسير استكمال المطالعة من حيث توقفت
          </p>
          
          {/* Search Form */}
          <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto group mb-12">
            <div className="relative flex items-center bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-2 transition-all focus-within:shadow-[0_8px_30px_rgb(21,71,52,0.08)] focus-within:border-primary-900/20">
              <Search className="absolute right-6 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث عن كتاب، مؤلف، أو موضوع..."
                className="w-full px-12 py-4 text-lg text-gray-900 bg-transparent focus:outline-none"
                dir="rtl"
              />
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="bg-primary-900 text-white px-10 py-3.5 rounded-xl font-bold hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'بحث'}
              </button>
            </div>
          </form>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
            {[
              { label: 'نشاط الموسوعة', value: '١', sub: 'عملية بحث كلية', icon: Activity },
              { label: 'الكتب المُكتشَفة', value: '١', sub: 'موضوع ومؤلف فريد', icon: BookOpen },
              { label: 'آخر ٢٤ ساعة', value: '١', sub: 'عملية بحث حديثة', icon: Clock },
            ].map((stat, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col items-center justify-center text-center group hover:border-primary-900/10 transition-all">
                <stat.icon className="w-8 h-8 text-primary-900/20 mb-4 group-hover:text-primary-900 transition-colors" />
                <h3 className="text-sm font-bold text-gray-800 mb-2">{stat.label}</h3>
                <p className="text-4xl font-black text-primary-900 mb-2">{stat.value}</p>
                <p className="text-[10px] text-gray-400 font-bold">{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Trending Searches */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-primary-900 font-bold text-sm">
              <Search className="w-4 h-4" />
              <span>عمليات البحث الشائعة</span>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {['صحيح البخاري'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setQuery(tag);
                    handleSearch(tag);
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-6 py-2 rounded-full text-xs font-bold transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
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