'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  Globe,
  Loader2,
  BookOpen,
  Sparkles,
  Save,
  LayoutDashboard,
  LogOut,
  FolderPlus,
  User,
  CheckCircle,
  AlertCircle,
  X,
  Library,
  Zap,
  Trash2,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { searchBooks, type Book, getBookFiles } from '@/lib/archive-api';
import { slugify, generateCategorySlug, generateEnglishSlug } from '@/lib/utils';
import { translations, type Language } from '@/lib/translations';

interface SeoBook {
  slug: string;
  title: string;
  author: string;
  description: string;
  category: string;
  category_slug?: string;
  archiveId: string;
  seoTitle?: string;
  parts_count?: number;
  lang?: string;
}

interface Category {
  slug: string;
  title: string;
  description: string;
  display_order?: number;
  lang?: string;
}

interface Author {
  slug: string;
  name: string;
  bio: string;
  lang?: string;
}

interface Suggestion {
  id: string;
  title: string;
  author: string;
  relevance_score: number;
  isExisting?: boolean;
  isVerified?: boolean;
  isAiChecked?: boolean;
  feedbackStatus?: string | null;
}

export default function AdminDashboard() {
  const [lang, setLang] = useState<Language>('ar');
  const t = translations[lang];
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [existingBookIds, setExistingBookIds] = useState<Set<string>>(new Set());
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [formData, setFormData] = useState<SeoBook>({
    slug: '',
    title: '',
    author: '',
    description: '',
    category: '',
    category_slug: '',
    archiveId: '',
    seoTitle: '',
    parts_count: 1
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState({ title: '', slug: '', description: '' });
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [isGeneratingCategory, setIsGeneratingCategory] = useState(false);

  const [authors, setAuthors] = useState<Author[]>([]);
  const [newAuthor, setNewAuthor] = useState({ name: '', slug: '', bio: '' });
  const [showAuthorForm, setShowAuthorForm] = useState(false);

  // Smart Suggestion States
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestionQuery, setSuggestionQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedCategoryForSuggestions, setSelectedCategoryForSuggestions] = useState<Category | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  const [suggestionStats, setSuggestionStats] = useState<{ totalFetched: number; preFiltered: number; aiApproved: number } | null>(null);
  const [showOnlyVerified, setShowOnlyVerified] = useState(true);

  // Pagination State for Suggestions
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  // Book Management States
  const [managedBooks, setManagedBooks] = useState<SeoBook[]>([]);
  const [selectedCategoryForManagement, setSelectedCategoryForManagement] = useState<string | null>(null);
  const [isDeletingBook, setIsDeletingBook] = useState<string | null>(null);
  const [totalBookCount, setTotalBookCount] = useState(0);
  const [categoryBookCounts, setCategoryBookCounts] = useState<Record<string, number>>({});
  const [isLoadingManagedBooks, setIsLoadingManagedBooks] = useState(false);

  const fetchCategories = useCallback(async () => {
    const res = await fetch(`/api/admin/categories?lang=${lang}`);
    if (res.ok) {
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    }
  }, [lang]);

  const fetchAuthors = useCallback(async () => {
    const res = await fetch(`/api/admin/authors?lang=${lang}`);
    if (res.ok) {
      const data = await res.json();
      setAuthors(Array.isArray(data) ? data : []);
    }
  }, [lang]);

  const fetchExistingBooks = useCallback(async () => {
    const res = await fetch(`/api/admin/books?lang=${lang}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        setExistingBookIds(new Set(data.map((b: SeoBook) => b.archiveId)));
      }
    }
  }, [lang]);

  const fetchBookCounts = useCallback(async () => {
    const res = await fetch(`/api/admin/books?lang=${lang}&counts=true`);
    if (res.ok) {
      const data = await res.json();
      setTotalBookCount(data.total);
      setCategoryBookCounts(data.categoryCounts);
    }
  }, [lang]);

  useEffect(() => {
    fetchCategories();
    fetchAuthors();
    fetchExistingBooks();
    fetchBookCounts();
  }, [lang, fetchCategories, fetchAuthors, fetchExistingBooks, fetchBookCounts]);

  const handleFetchManagedBooks = useCallback(async (categorySlug: string) => {
    setIsLoadingManagedBooks(true);
    try {
      const res = await fetch(`/api/admin/books?lang=${lang}&categorySlug=${categorySlug}`);
      if (res.ok) {
        const data = await res.json();
        setManagedBooks(data);
      }
    } catch (e) {
      console.error('Error fetching managed books:', e);
    } finally {
      setIsLoadingManagedBooks(false);
    }
  }, [lang]);

  useEffect(() => {
    if (selectedCategoryForManagement) {
      handleFetchManagedBooks(selectedCategoryForManagement);
    } else {
        setManagedBooks([]);
    }
  }, [selectedCategoryForManagement, handleFetchManagedBooks]);

  const handleDeleteBook = async (archiveId: string) => {
    if (!confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا الكتاب؟' : 'Are you sure you want to delete this book?')) return;

    setIsDeletingBook(archiveId);
    try {
      const res = await fetch(`/api/admin/books?archiveId=${archiveId}`, { method: 'DELETE' });
      if (res.ok) {
        setManagedBooks(prev => prev.filter(b => b.archiveId !== archiveId));
        setExistingBookIds(prev => {
          const next = new Set(prev);
          next.delete(archiveId);
          return next;
        });
        fetchBookCounts();
      } else {
        alert('Failed to delete book');
      }
    } catch (e) {
      alert('Error connecting to API');
    } finally {
      setIsDeletingBook(null);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true);
    try {
      const data = await searchBooks(query);
      setResults(data.books);
    } catch (err) {
      alert(t.error_search + ': ' + (err instanceof Error ? err.message : ''));
    } finally {
      setIsLoading(false);
    }
  };

  const selectBook = async (book: Book) => {
    setSelectedBook(book);

    let partsCount = 1;
    try {
      const files = await getBookFiles(book.identifier);
      partsCount = files.length;
    } catch (e) {}

    const cleanSlug = lang === 'ar' ? slugify(book.title) : generateEnglishSlug(book.title);
    const defaultCategory = categories[0] || { title: lang === 'ar' ? 'عام' : 'General', slug: lang === 'ar' ? 'عام' : 'general' };

    setFormData({
      slug: cleanSlug,
      title: book.title,
      author: book.author || '',
      description: '',
      category: defaultCategory.title,
      category_slug: defaultCategory.slug,
      archiveId: book.identifier,
      seoTitle: lang === 'ar'
        ? `تحميل كتاب ${book.title} PDF وقراءته أونلاين - موسوعة كنوز العلم`
        : `Download ${book.title} PDF - Read Online - Kono Elm Encyclopedia`,
      parts_count: partsCount,
      lang: lang
    });
  };

  const generateContent = async () => {
    if (!formData.title) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/admin/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: formData.title, author: formData.author, lang }),
      });
      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({
          ...prev,
          description: data.description,
          seoTitle: data.seoTitle
        }));
      } else {
        const err = await res.json();
        alert(t.admin_bulk_error + ': ' + (err.error || ''));
      }
    } catch (err) {
      alert(t.admin_conn_error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveBook = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, lang }),
      });
      if (res.ok) {
        alert(t.admin_success_save_book);
        setSelectedBook(null);
        fetchExistingBooks();
      } else {
        const err = await res.json();
        alert(t.admin_error_save_book + ': ' + (err.error || ''));
      }
    } catch (err) {
      alert(t.admin_conn_error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCategory = async (e?: React.FormEvent | Category, categoryData?: any) => {
    if (e && 'preventDefault' in e) {
      e.preventDefault();
    }

    console.log("Submitting category...", { newCategory, categoryData });

    // If the first argument is a category object (from order update), use it
    // Otherwise use newCategory state
    const isEvent = e && 'preventDefault' in e;
    const dataToSave = (!e || isEvent) ? newCategory : (e as Category);

    const payload = {
      ...dataToSave,
      slug: dataToSave.slug || (lang === 'ar' ? generateCategorySlug(dataToSave.title) : generateEnglishSlug(dataToSave.title)),
      lang
    };

    if (!payload.title) {
      console.warn("Category title is missing, aborting save.");
      return;
    }

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        if (!categoryData) {
          alert(t.admin_success_save_cat);
          setNewCategory({ title: '', slug: '', description: '' });
          setShowCategoryForm(false);
        }
        fetchCategories();
      } else {
        const err = await res.json();
        alert(t.admin_error_save_cat + ': ' + (err.error || ''));
      }
    } catch (e) {
      alert(t.admin_conn_error);
    }
  };

  const updateCategoryOrder = async (category: Category, direction: 'up' | 'down') => {
    const currentIndex = categories.findIndex(c => c.slug === category.slug);
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === categories.length - 1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const targetCategory = categories[targetIndex];

    const currentOrder = category.display_order || 0;
    const targetOrder = targetCategory.display_order || 0;

    // Swap orders
    await handleSaveCategory({ ...category, display_order: targetIndex });
    await handleSaveCategory({ ...targetCategory, display_order: currentIndex });
    fetchCategories();
  };

  const handleGenerateCategoryDescription = async () => {
    if (!newCategory.title) return;
    setIsGeneratingCategory(true);
    try {
      const res = await fetch('/api/admin/generate/category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newCategory.title, lang }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewCategory(prev => ({ ...prev, description: data.description }));
      } else {
        alert('فشل توليد الوصف');
      }
    } catch (e) {
      alert('خطأ في الاتصال');
    } finally {
      setIsGeneratingCategory(false);
    }
  };

  const handleSaveAuthor = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    console.log("Submitting author...", newAuthor);

    if (!newAuthor.name) return;
    const payload = {
      ...newAuthor,
      slug: lang === 'ar' ? slugify(newAuthor.name) : generateEnglishSlug(newAuthor.name),
      lang
    };
    try {
      const res = await fetch('/api/admin/authors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        alert(t.admin_success_save_author);
        setNewAuthor({ name: '', slug: '', bio: '' });
        setShowAuthorForm(false);
        fetchAuthors();
      } else {
        const err = await res.json();
        alert(t.admin_error_save_author + ': ' + (err.error || ''));
      }
    } catch (e) {
      alert(t.admin_conn_error);
    }
  };

  // --- Smart Suggestion Handlers ---

  const handleSuggestBooks = async (category: Category, customQuery?: string) => {
    setSelectedCategoryForSuggestions(category);
    setIsSuggesting(true);

    if (!customQuery) {
        setSuggestions([]);
        setSelectedSuggestions(new Set());
        setCurrentPage(1);
        setSuggestionQuery(category.title);
    }

    try {
      const res = await fetch('/api/admin/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            category: category.title,
            categorySlug: category.slug,
            query: customQuery || category.title,
            lang: lang
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
        setSuggestionStats(data.stats || null);
      } else {
        const err = await res.json();
        alert(t.admin_bulk_error + ': ' + (err.error || ''));
      }
    } catch (err) {
      alert(t.admin_conn_error);
    } finally {
      setIsSuggesting(false);
    }
  };

  const toggleSuggestionSelection = (id: string) => {
    const next = new Set(selectedSuggestions);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedSuggestions(next);
  };

  const handleRejectSuggestions = async () => {
    if (!selectedCategoryForSuggestions || selectedSuggestions.size === 0) return;

    const booksToReject = suggestions.filter(s => selectedSuggestions.has(s.id));

    try {
        const res = await fetch('/api/admin/suggest/reject', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                books: booksToReject,
                categorySlug: selectedCategoryForSuggestions.slug,
                lang: lang
            }),
        });

        if (res.ok) {
            setSuggestions(prev => prev.filter(s => !selectedSuggestions.has(s.id)));
            setSelectedSuggestions(new Set());
        }
    } catch (e) {}
  };

  const handleBulkAdd = async () => {
    if (!selectedCategoryForSuggestions || selectedSuggestions.size === 0) return;

    setIsBulkAdding(true);

    const selectedBooks = suggestions
      .filter(s => selectedSuggestions.has(s.id))
      .map(s => ({
        ...s,
        is_english_verified: s.isVerified
      }));

    try {
      const res = await fetch('/api/admin/books/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          books: selectedBooks,
          category: selectedCategoryForSuggestions.title,
          categorySlug: selectedCategoryForSuggestions.slug, // Ensure correct slug is passed
          lang: lang
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const failures = data.results?.filter((r: any) => r.status === 'error') || [];

        if (failures.length > 0) {
            alert(t.admin_bulk_partial_error.replace('{count}', failures.length.toString()));
            console.error('Bulk addition failures:', failures);
        } else {
            alert(t.admin_bulk_success);
        }

        setSelectedCategoryForSuggestions(null);
        fetchExistingBooks();
      } else {
        const err = await res.json();
        alert(t.admin_bulk_error + ': ' + (err.error || ''));
      }
    } catch (err) {
      alert(t.admin_conn_error);
    } finally {
      setIsBulkAdding(false);
    }
  };

  // Filtering & Pagination Logic
  const filteredSuggestions = lang === 'en' && showOnlyVerified
    ? suggestions.filter(s => s.isVerified)
    : suggestions;

  const totalPages = Math.ceil(filteredSuggestions.length / ITEMS_PER_PAGE);
  const currentItems = filteredSuggestions.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className={`min-h-screen bg-gray-50 font-tajawal ${lang === 'ar' ? 'font-arabic' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Sidebar/Header */}
      <header className="bg-primary-900 text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-6 h-6 text-gold-400" />
            <h1 className="text-xl font-bold">{t.admin_title}</h1>
          </div>

          {/* Language Switcher Tabs */}
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setLang('ar')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${lang === 'ar' ? 'bg-gold-500 text-primary-900 shadow-lg' : 'text-primary-100 hover:bg-white/10'}`}
            >
              {t.admin_tab_arabic}
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${lang === 'en' ? 'bg-gold-500 text-primary-900 shadow-lg' : 'text-primary-100 hover:bg-white/10'}`}
            >
              {t.admin_tab_english}
            </button>
          </div>

          <button
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2 text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all"
          >
            <LogOut className="w-4 h-4" />
            {t.admin_main_site}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Left Column: Search & Lists */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary-900">
              <Search className="w-5 h-5" />
              {t.admin_search_archive}
            </h2>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.search_placeholder}
                className={`flex-1 px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary-500 ${lang === 'en' ? 'text-left' : 'text-right'}`}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="bg-primary-900 text-white px-6 py-2 rounded-xl font-bold hover:bg-primary-800 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t.search_button}
              </button>
            </form>
          </div>

          <div className="space-y-4">
            {results.map((book) => {
              const exists = existingBookIds.has(book.identifier);
              return (
                <div key={book.identifier} className={`bg-white p-4 rounded-xl shadow-sm border ${exists ? 'border-green-100 bg-green-50/20' : 'border-gray-100'} flex justify-between items-center group hover:border-gold-300 transition-all`}>
                  <div className="flex-1 min-w-0 ml-4">
                    <h3 className="font-bold text-gray-900 truncate flex items-center gap-2">
                      {book.title}
                      {exists && <CheckCircle className="w-4 h-4 text-green-500" />}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">{book.author}</p>
                  </div>
                  <button
                    onClick={() => selectBook(book)}
                    className={`p-2 rounded-lg transition-all ${exists ? 'bg-green-100 text-green-700' : 'bg-gold-50 text-gold-700 hover:bg-gold-500 hover:text-white'}`}
                    title={exists ? 'تعديل البيانات' : 'إضافة للنظام'}
                  >
                    {exists ? <Sparkles className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Editing Forms & Category/Author Management */}
        <div className="space-y-6">
          {selectedBook ? (
            <div className="bg-white p-6 rounded-3xl shadow-lg border-2 border-gold-400 sticky top-24">
              <h2 className="text-xl font-bold mb-6 flex items-center justify-between text-primary-900">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-gold-600" />
                  {t.admin_seo_preparation}
                </span>
                <button onClick={() => setSelectedBook(null)} className="text-sm text-gray-400 hover:text-gray-600">{t.admin_cancel}</button>
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">{t.admin_seo_meta_title}</label>
                  <input
                    type="text"
                    value={formData.seoTitle}
                    onChange={(e) => setFormData({...formData, seoTitle: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">{t.admin_slug}</label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({...formData, slug: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none text-left"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">{t.admin_category}</label>
                    <select
                      value={formData.category_slug}
                      onChange={(e) => {
                          const cat = categories.find(c => c.slug === e.target.value);
                          setFormData({...formData, category_slug: e.target.value, category: cat?.title || 'عام'});
                      }}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                    >
                      {categories.map(c => (
                        <option key={c.slug} value={c.slug}>{c.title}</option>
                      ))}
                      <option value="عام">عام</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">{t.admin_author}</label>
                    <input
                      type="text"
                      list="authors-list"
                      value={formData.author}
                      onChange={(e) => setFormData({...formData, author: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                    <datalist id="authors-list">
                      {authors.map(a => <option key={a.slug} value={a.name} />)}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">{t.admin_parts_count}</label>
                    <input
                      type="number"
                      value={formData.parts_count}
                      onChange={(e) => setFormData({...formData, parts_count: parseInt(e.target.value) || 1})}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none"
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-bold text-gray-700">{t.admin_seo_description}</label>
                    <button
                      onClick={generateContent}
                      disabled={isGenerating}
                      className="text-xs flex items-center gap-1 text-gold-600 hover:text-gold-700 font-bold bg-gold-50 px-2 py-1 rounded"
                    >
                      {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      {t.admin_generate_ai}
                    </button>
                  </div>
                  <textarea
                    rows={10}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none text-sm leading-relaxed"
                  />
                  <p className="text-[10px] text-gray-400 mt-1 italic">{t.admin_desc_limit_hint}</p>
                </div>

                <button
                  onClick={handleSaveBook}
                  disabled={isSaving || !formData.description}
                  className="w-full bg-primary-900 text-white py-4 rounded-2xl font-bold hover:bg-primary-800 transition-all flex items-center justify-center gap-2 shadow-xl"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {existingBookIds.has(formData.archiveId) ? t.admin_update_data : t.admin_save_and_publish}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">

              {/* Category Management with Smart Suggestion Button */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2 text-primary-900">
                    <FolderPlus className="w-5 h-5" />
                    {t.admin_categories_suggestions}
                  </h2>
                  <button
                    onClick={() => setShowCategoryForm(!showCategoryForm)}
                    className="text-xs bg-gold-50 text-gold-700 px-3 py-1 rounded-lg font-bold"
                  >
                    {showCategoryForm ? t.admin_cancel : t.admin_add_category}
                  </button>
                </div>

                {showCategoryForm && (
                  <form onSubmit={handleSaveCategory} className="space-y-4 mb-6 p-4 bg-gray-50 rounded-xl border border-gold-100">
                    <input
                      placeholder={t.admin_cat_placeholder}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200"
                      value={newCategory.title}
                      onChange={e => setNewCategory({...newCategory, title: e.target.value})}
                      required
                    />
                    <div className="relative">
                      <textarea
                        placeholder={t.admin_cat_desc_placeholder}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 min-h-[100px]"
                        value={newCategory.description}
                        onChange={e => setNewCategory({...newCategory, description: e.target.value})}
                      />
                      <button
                        type="button"
                        onClick={handleGenerateCategoryDescription}
                        disabled={isGeneratingCategory || !newCategory.title}
                        className={`absolute bottom-3 ${lang === 'en' ? 'right-3' : 'left-3'} flex items-center gap-1 text-[10px] bg-gold-100 text-gold-700 px-2 py-1 rounded font-bold hover:bg-gold-200 transition-all disabled:opacity-50`}
                      >
                        {isGeneratingCategory ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        {t.admin_generate_ai}
                      </button>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-primary-900 text-white py-2 rounded-lg font-bold hover:bg-primary-800 transition-all"
                    >
                      {t.admin_save_category}
                    </button>
                  </form>
                )}

                <div className="grid grid-cols-1 gap-2">
                  {categories.map((c, idx) => (
                    <div key={c.slug} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-gold-300 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => updateCategoryOrder(c, 'up')}
                            disabled={idx === 0}
                            className="p-0.5 hover:bg-gold-100 rounded disabled:opacity-30"
                          >
                            <ChevronUp className="w-4 h-4 text-gold-600" />
                          </button>
                          <button
                            onClick={() => updateCategoryOrder(c, 'down')}
                            disabled={idx === categories.length - 1}
                            className="p-0.5 hover:bg-gold-100 rounded disabled:opacity-30"
                          >
                            <ChevronDown className="w-4 h-4 text-gold-600" />
                          </button>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-gray-700">{c.title}</span>
                            <span className="text-[10px] text-gray-400 font-mono" dir="ltr">{c.slug}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSuggestBooks(c)}
                        className="flex items-center gap-1 text-xs bg-gold-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-gold-700 transition-all shadow-sm"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        {t.admin_smart_suggestions}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Authors Management */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2 text-primary-900">
                    <User className="w-5 h-5" />
                    {t.admin_authors_management}
                  </h2>
                  <button
                    onClick={() => setShowAuthorForm(!showAuthorForm)}
                    className="text-xs bg-gold-50 text-gold-700 px-3 py-1 rounded-lg font-bold"
                  >
                    {showAuthorForm ? t.admin_cancel : t.admin_add_author}
                  </button>
                </div>

                {showAuthorForm && (
                  <form onSubmit={handleSaveAuthor} className="space-y-4 mb-6 p-4 bg-gray-50 rounded-xl border border-gold-100">
                    <input
                      placeholder={t.admin_author_name_placeholder}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200"
                      value={newAuthor.name}
                      onChange={e => setNewAuthor({...newAuthor, name: e.target.value})}
                      required
                    />
                    <textarea
                      placeholder={t.admin_author_bio_placeholder}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200"
                      value={newAuthor.bio}
                      onChange={e => setNewAuthor({...newAuthor, bio: e.target.value})}
                    />
                    <button
                      type="submit"
                      className="w-full bg-primary-900 text-white py-2 rounded-lg font-bold"
                    >
                      {t.admin_save_author}
                    </button>
                  </form>
                )}
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                  {authors.map(a => (
                    <span key={a.slug} className="bg-primary-50 text-primary-700 px-2 py-1 rounded-md text-[10px] font-medium border border-primary-100">
                      {a.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-gold-50 p-8 rounded-3xl border border-gold-200 text-center">
                <Sparkles className="w-12 h-12 text-gold-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-primary-900 mb-2">{t.admin_smart_system_ready}</h3>
                <p className="text-gray-600 text-sm">{t.admin_smart_system_desc}</p>
              </div>
            </div>
          )}
        </div>

      </main>

      {/* Book Management Section */}
      <section className="max-w-7xl mx-auto p-4 md:p-8 border-t border-gray-200 mt-8">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <Library className="w-6 h-6 text-primary-900" />
              <h2 className="text-xl font-bold text-primary-900">{lang === 'ar' ? 'إدارة الكتب والمحتوى' : 'Content & Books Management'}</h2>
            </div>
            <div className="flex items-center gap-4">
                <div className="bg-primary-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                    <span>{lang === 'ar' ? 'إجمالي الكتب:' : 'Total Books:'}</span>
                    <span className="text-gold-400 text-lg">{totalBookCount}</span>
                </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 min-h-[400px]">
            {/* Categories Sidebar */}
            <div className="lg:col-span-1 border-l border-gray-100 p-4 space-y-2 max-h-[600px] overflow-y-auto">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">{lang === 'ar' ? 'التصنيفات' : 'Categories'}</h3>
              {categories.map(cat => (
                <button
                  key={cat.slug}
                  onClick={() => setSelectedCategoryForManagement(cat.slug)}
                  className={`w-full text-right flex items-center justify-between p-3 rounded-xl transition-all ${selectedCategoryForManagement === cat.slug ? 'bg-primary-900 text-white shadow-lg scale-[1.02]' : 'hover:bg-gray-100 text-gray-700'}`}
                  dir={lang === 'ar' ? 'rtl' : 'ltr'}
                >
                  <span className="font-bold truncate ml-2">{cat.title}</span>
                  <span className={`text-[10px] px-2 py-1 rounded-full ${selectedCategoryForManagement === cat.slug ? 'bg-white/20' : 'bg-gray-200'}`}>
                    {categoryBookCounts[cat.slug] || 0}
                  </span>
                </button>
              ))}
            </div>

            {/* Books List */}
            <div className="lg:col-span-3 p-6 bg-gray-50/30">
              {!selectedCategoryForManagement ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                  <BookOpen className="w-16 h-16 opacity-20" />
                  <p className="font-bold">{lang === 'ar' ? 'اختر تصنيفاً لعرض الكتب' : 'Select a category to view books'}</p>
                </div>
              ) : isLoadingManagedBooks ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
                </div>
              ) : managedBooks.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                  <AlertCircle className="w-12 h-12 opacity-20" />
                  <p className="font-bold">{lang === 'ar' ? 'لا توجد كتب في هذا التصنيف' : 'No books in this category'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {managedBooks.map(book => (
                    <div key={book.archiveId} className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center group hover:border-red-200 transition-all">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-gray-900 truncate" title={book.title}>{book.title}</h4>
                        <p className="text-xs text-gray-500 truncate">{book.author}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteBook(book.archiveId)}
                        disabled={isDeletingBook === book.archiveId}
                        className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      >
                        {isDeletingBook === book.archiveId ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Suggested Books Modal */}
      {selectedCategoryForSuggestions && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-primary-900 text-white space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Zap className="w-6 h-6 text-gold-400" />
                    {t.admin_suggested_books.replace('{category}', selectedCategoryForSuggestions.title)}
                  </h2>
                  <p className="text-xs text-primary-100 mt-1">{t.admin_found_books.replace('{count}', suggestions.length.toString())}</p>
                </div>
                <button
                  onClick={() => setSelectedCategoryForSuggestions(null)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  disabled={isBulkAdding}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Stats & Controls */}
              {lang === 'en' && suggestionStats && (
                <div className="grid grid-cols-3 gap-2 py-2 border-t border-white/10">
                    <div className="text-center">
                        <p className="text-[10px] text-white/50 uppercase">Total Fetched</p>
                        <p className="font-bold text-lg">{suggestionStats.totalFetched}</p>
                    </div>
                    <div className="text-center border-x border-white/10">
                        <p className="text-[10px] text-white/50 uppercase">Pre-Filtered</p>
                        <p className="font-bold text-lg text-gold-400">{suggestionStats.preFiltered}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] text-white/50 uppercase">AI Approved</p>
                        <p className="font-bold text-lg text-green-400">{suggestionStats.aiApproved}</p>
                    </div>
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-4 items-center">
                  {lang === 'en' && (
                    <button
                        onClick={() => setShowOnlyVerified(!showOnlyVerified)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${showOnlyVerified ? 'bg-green-500 border-green-400 text-white shadow-lg' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
                    >
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs font-bold">Show Only Verified</span>
                    </button>
                  )}

                  {/* In-Modal Search */}
                  <div className="relative flex-1 w-full">
                    <input
                        type="text"
                        value={suggestionQuery}
                        onChange={(e) => setSuggestionQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSuggestBooks(selectedCategoryForSuggestions, suggestionQuery)}
                        placeholder={t.admin_search_more}
                        className={`w-full bg-white/10 border border-white/20 rounded-xl py-2 px-4 ${lang === 'en' ? 'pl-10' : 'pr-10'} text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-gold-500/50`}
                    />
                    <Search className={`absolute ${lang === 'en' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-white/40`} />
                    <button
                        onClick={() => handleSuggestBooks(selectedCategoryForSuggestions, suggestionQuery)}
                        disabled={isSuggesting}
                        className={`absolute ${lang === 'en' ? 'right-1.5' : 'left-1.5'} top-1.5 bottom-1.5 bg-gold-500 text-primary-900 px-4 rounded-lg text-xs font-bold hover:bg-gold-400 disabled:opacity-50`}
                    >
                        {isSuggesting ? <Loader2 className="w-3 h-3 animate-spin" /> : t.search_button}
                    </button>
                  </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {isSuggesting ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-500">
                  <Loader2 className="w-12 h-12 animate-spin text-gold-500" />
                  <p className="font-bold text-center px-4">{t.admin_analyzing}</p>
                </div>
              ) : suggestions.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                  <Library className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>لم يتم العثور على اقتراحات جديدة لهذا التصنيف حالياً.</p>
                </div>
              ) : (
                <>
                    <div className="space-y-4">
                        {currentItems.map((s) => {
                          const isAdded = s.isExisting || s.feedbackStatus === 'selected';
                          const isRejected = s.feedbackStatus === 'rejected';

                          return (
                            <div
                                key={s.id}
                                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${isAdded ? 'bg-green-50/50 border-green-100 opacity-70 cursor-not-allowed' : isRejected ? 'bg-red-50/50 border-red-100 opacity-70' : selectedSuggestions.has(s.id) ? 'border-gold-500 bg-gold-50/50 cursor-pointer' : 'border-gray-100 hover:border-gray-200 bg-gray-50/30 cursor-pointer'}`}
                                onClick={() => !isAdded && toggleSuggestionSelection(s.id)}
                            >
                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${isAdded ? 'bg-green-500 border-green-500 text-white' : selectedSuggestions.has(s.id) ? 'bg-gold-500 border-gold-500 text-white' : 'border-gray-300'}`}>
                                    {(selectedSuggestions.has(s.id) || isAdded) && <CheckCircle className="w-4 h-4" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-900 line-clamp-1">{s.title}</h4>
                                <p className="text-sm text-gray-500 truncate">{s.author}</p>
                                </div>
                                <div className={`${lang === 'en' ? 'text-right' : 'text-left'} flex-shrink-0 flex flex-col gap-1 items-end`}>
                                    <div className="flex gap-1">
                                        {s.isVerified && (
                                            <span className="text-[8px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded uppercase tracking-wider flex items-center gap-0.5">
                                                <CheckCircle className="w-2.5 h-2.5" />
                                                Verified English
                                            </span>
                                        )}
                                        {s.isAiChecked && (
                                            <span className="text-[8px] font-bold px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded uppercase tracking-wider flex items-center gap-0.5">
                                                <Zap className="w-2.5 h-2.5" />
                                                AI Checked
                                            </span>
                                        )}
                                    </div>
                                    {isAdded && (
                                        <span className="text-[10px] font-bold px-2 py-1 bg-green-100 text-green-700 rounded-full">{t.admin_added_already}</span>
                                    )}
                                    {isRejected && (
                                        <span className="text-[10px] font-bold px-2 py-1 bg-red-100 text-red-700 rounded-full">{t.admin_rejected}</span>
                                    )}
                                    {!isAdded && !isRejected && (
                                        <span className="text-[10px] font-bold px-2 py-1 bg-primary-100 text-primary-700 rounded-full">{t.admin_new}</span>
                                    )}
                                </div>
                            </div>
                          );
                        })}
                    </div>
                </>
              )}
            </div>

            {suggestions.length > 0 && !isSuggesting && (
              <div className="p-4 bg-gray-50 border-t border-gray-100 space-y-4">
                {/* Pagination Controls */}
                <div className="flex justify-center items-center gap-4 border-b border-gray-200 pb-4">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 bg-white rounded-lg border border-gray-200 disabled:opacity-30"
                    >
                        {lang === 'en' ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    <span className="text-sm font-bold text-gray-600">
                        {t.page_of.replace('{current}', currentPage.toString()).replace('{total}', (totalPages || 1).toString())}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 bg-white rounded-lg border border-gray-200 disabled:opacity-30"
                    >
                        {lang === 'en' ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                    </button>
                </div>

                <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                        <button
                            onClick={handleRejectSuggestions}
                            disabled={selectedSuggestions.size === 0 || isBulkAdding}
                            className="px-6 py-2 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-all flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            {t.admin_reject_selected}
                        </button>
                        <p className="text-sm text-gray-500 self-center">{t.admin_selected_count.replace('{count}', selectedSuggestions.size.toString())}</p>
                    </div>

                    <button
                    onClick={handleBulkAdd}
                    disabled={selectedSuggestions.size === 0 || isBulkAdding}
                    className="px-10 py-3 bg-primary-900 text-white rounded-xl font-bold hover:bg-primary-800 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
                    >
                    {isBulkAdding ? (
                        <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {t.admin_processing}
                        </>
                    ) : (
                        <>
                        <Plus className="w-5 h-5" />
                        {t.admin_add_selected}
                        </>
                    )}
                    </button>
                </div>
              </div>
            )}

            {isBulkAdding && (
              <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center p-10 text-center z-10">
                <Loader2 className="w-16 h-16 animate-spin text-gold-600 mb-6" />
                <h3 className="text-2xl font-bold text-primary-900 mb-2">{t.admin_ai_magic_working}</h3>
                <p className="text-gray-600 max-w-md">{t.admin_ai_magic_desc}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
