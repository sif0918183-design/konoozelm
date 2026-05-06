'use client';

import { useState, useCallback, useEffect } from 'react';
import { Search, BookOpen, Download, Loader2, AlertCircle, ArrowRight, Globe } from 'lucide-react';
import { searchBooks, type Book } from '@/lib/archive-api';
import { logSearch } from '@/lib/supabase';
import BookCard from '@/components/BookCard';
import SearchSkeleton from '@/components/SearchSkeleton';
import RecentBooks from '@/components/RecentBooks';
import { translations } from '@/lib/translations';
import Link from 'next/link';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Logo from '@/components/Logo';


export default function EnglishHome() {
  const lang = 'en';
  const t = translations[lang];
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Restore search state from sessionStorage
  useEffect(() => {
    const savedState = sessionStorage.getItem('searchState_en');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setQuery(parsed.query || '');
        setBooks(parsed.books || []);
        setHasSearched(parsed.hasSearched || false);
        setTotalResults(parsed.totalResults || 0);
        setPage(parsed.page || 1);
        setHasMore(parsed.hasMore || false);
      } catch (e) {
        console.error('Error restoring search state:', e);
      }
    }
  }, []);

  // Save search state to sessionStorage
  useEffect(() => {
    if (hasSearched) {
      const state = { query, books, hasSearched, totalResults, page, hasMore };
      sessionStorage.setItem('searchState_en', JSON.stringify(state));
    }
  }, [query, books, hasSearched, totalResults, page, hasMore]);

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
      setError(err instanceof Error ? err.message : t.error_search);
    } finally {
      setIsLoading(false);
    }
  }, [t.error_search]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      handleSearch(query, page + 1);
    }
  };

  const handleResetSearch = () => {
    setQuery('');
    setBooks([]);
    setHasSearched(false);
    setTotalResults(0);
    setPage(1);
    setHasMore(false);
    setError(null);
    sessionStorage.removeItem('searchState_en');
  };

  const [featuredCategories, setFeaturedCategories] = useState<{title: string, slug: string}[]>([]);

  useEffect(() => {
    fetch(`/api/admin/categories?lang=${lang}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setFeaturedCategories(data);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-transparent">
      {/* Header */}
      <header className="bg-primary-900 text-white pt-2 pb-20 md:pb-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 border-4 border-white/20 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 border-4 border-white/20 rounded-full translate-x-1/3 translate-y-1/3" />
        </div>

        <LanguageSwitcher light />

        <div className="max-w-4xl mx-auto text-center relative z-10 mt-8 md:mt-4 flex flex-col items-center">
          <Logo lang="en" className="mb-8" />
          <div className="flex flex-col gap-3 mb-10">
            <div className="inline-flex items-center justify-center gap-2 text-[10px] md:text-xs text-gold-200/80 bg-white/5 py-1.5 px-4 rounded-full self-center border border-white/10 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
              {t.offline_notice}
            </div>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto group">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-900/40 w-5 h-5 group-focus-within:text-primary-900 transition-colors" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.search_placeholder}
                className="w-full pr-20 md:pr-24 pl-10 md:pl-12 py-4 text-left text-base md:text-lg text-gray-900 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl focus:outline-none focus:ring-4 focus:ring-gold-500/30 transition-all border-2 border-transparent focus:border-gold-500/50 block"
                dir="ltr"
              />
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary-900 text-gold-200 hover:text-white px-4 md:px-8 py-3 rounded-xl font-bold hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t.search_button}
              </button>
            </div>
          </form>
        </div>
      </header>

      {/* Results Section */}
      <main className="max-w-7xl mx-auto px-4 -mt-10 relative z-20 pb-20">

        {/* Recent Books (Always visible if exists) */}
        {!hasSearched && !isLoading && (
          <div className="mb-12">
            <RecentBooks lang="en" />
          </div>
        )}

        {/* Featured Categories */}
        {!hasSearched && !isLoading && featuredCategories.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-primary-900 mb-8 border-l-4 border-gold-500 pl-4">{t.featured_categories}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5">
              {featuredCategories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/en/${cat.slug}`}
                  className="group relative flex flex-col items-center justify-center p-6 bg-white rounded-[2rem] border border-primary-900/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(15,46,34,0.12)] hover:-translate-y-1.5 transition-all duration-500 text-center min-h-[140px]"
                >
                  <div className="absolute top-0 left-0 w-24 h-24 bg-primary-50/30 rounded-br-[4rem] -z-0 transition-all duration-500 group-hover:bg-gold-50/50 group-hover:w-full group-hover:h-full group-hover:rounded-[2rem]" />
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-primary-900 rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-lg group-hover:scale-110 transition-transform duration-500">
                      <BookOpen className="w-6 h-6 text-gold-200" />
                    </div>
                    <p className="text-sm md:text-base font-bold text-gray-900 group-hover:text-primary-900 transition-colors leading-relaxed line-clamp-3">
                      {cat.title}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Results Info */}
        {hasSearched && !error && (
          <div className="mb-6 flex items-center justify-between gap-4" dir="ltr">
            <p className="text-white bg-primary-900/80 backdrop-blur-md px-4 py-2 rounded-full text-xs md:text-sm border border-white/10 shadow-lg">
              {!isLoading && (
                <>
                  {t.results_found.replace('{count}', totalResults.toString())}
                </>
              )}
            </p>
            <button
              onClick={handleResetSearch}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs md:text-sm bg-white hover:bg-gold-50 text-primary-900 transition-all border border-primary-900/20 font-bold shadow-md active:scale-95"
            >
              <ArrowRight className="w-4 h-4" />
              {t.back_to_home}
            </button>
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
              <BookCard key={book.identifier} book={book} lang="en" />
            ))}
          </div>
        )}

        {/* No Results */}
        {hasSearched && !isLoading && books.length === 0 && !error && (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">{t.no_results}</p>
            <p className="text-gray-400">{t.try_another_word}</p>
          </div>
        )}

        {/* Load More */}
        {hasMore && !isLoading && (
          <div className="text-center mt-8">
            <button
              onClick={handleLoadMore}
              className="bg-primary-600 text-white px-8 py-3 rounded-full font-medium hover:bg-primary-700 transition-all"
            >
              {t.load_more}
            </button>
          </div>
        )}

        {/* Loading More Indicator */}
        {isLoading && books.length > 0 && (
          <div className="flex justify-center mt-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        )}

        {/* Initial State (Placeholder if no recent books) */}
        {!hasSearched && !isLoading && books.length === 0 && (
          <div className="text-center py-8">
            <div className="bg-primary-50 inline-flex p-4 rounded-full mb-4">
              <Search className="w-12 h-12 text-primary-400" />
            </div>
            <p className="text-gray-500 text-lg">{t.search_start_title}</p>
            <p className="text-gray-400 mt-2">{t.search_start_desc}</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-16 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center flex flex-col items-center">
          <Logo lang="en" className="mb-6 scale-75 md:scale-90" />
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('show-pwa-install-prompt'))}
            className="mb-6 text-primary-900/40 hover:text-primary-900 text-xs font-bold transition-colors border border-primary-900/10 px-3 py-1 rounded-full"
          >
            {t.pwa_install_title}
          </button>
          <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
            {t.footer_text}
          </p>
          <div className="mt-8 pt-8 border-t border-gray-50 text-gray-400 text-xs">
            {t.rights_reserved.replace('{year}', new Date().getFullYear().toString())}
          </div>
        </div>
      </footer>
    </div>
  );
}
