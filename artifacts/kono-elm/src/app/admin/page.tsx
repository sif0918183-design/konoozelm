'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
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
  ChevronLeft
} from 'lucide-react';
import { searchBooks, type Book, getBookFiles } from '@/lib/archive-api';
import { slugify } from '@/lib/utils';

interface SeoBook {
  slug: string;
  title: string;
  author: string;
  description: string;
  category: string;
  archiveId: string;
  seoTitle?: string;
  parts_count?: number;
}

interface Category {
  slug: string;
  title: string;
  description: string;
}

interface Author {
  slug: string;
  name: string;
  bio: string;
}

interface Suggestion {
  id: string;
  title: string;
  author: string;
  relevance_score: number;
}

export default function AdminDashboard() {
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
    archiveId: '',
    seoTitle: '',
    parts_count: 1
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState({ title: '', slug: '', description: '' });
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  const [authors, setAuthors] = useState<Author[]>([]);
  const [newAuthor, setNewAuthor] = useState({ name: '', slug: '', bio: '' });
  const [showAuthorForm, setShowAuthorForm] = useState(false);

  // Smart Suggestion States
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedCategoryForSuggestions, setSelectedCategoryForSuggestions] = useState<Category | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [isBulkAdding, setIsBulkAdding] = useState(false);

  // Pagination State for Suggestions
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  useEffect(() => {
    fetchCategories();
    fetchAuthors();
    fetchExistingBooks();
  }, []);

  const fetchCategories = async () => {
    const res = await fetch('/api/admin/categories');
    if (res.ok) {
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    }
  };

  const fetchAuthors = async () => {
    const res = await fetch('/api/admin/authors');
    if (res.ok) {
      const data = await res.json();
      setAuthors(Array.isArray(data) ? data : []);
    }
  };

  const fetchExistingBooks = async () => {
    const res = await fetch('/api/admin/books');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        setExistingBookIds(new Set(data.map((b: SeoBook) => b.archiveId)));
      }
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
      alert('خطأ في البحث: ' + (err instanceof Error ? err.message : 'حدث خطأ غير معروف'));
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

    const cleanSlug = slugify(book.title);

    setFormData({
      slug: cleanSlug,
      title: book.title,
      author: book.author || '',
      description: '',
      category: categories[0]?.title || 'عام',
      archiveId: book.identifier,
      seoTitle: `تحميل كتاب ${book.title} PDF وقراءته أونلاين - موسوعة كنوز العلم`,
      parts_count: partsCount
    });
  };

  const generateContent = async () => {
    if (!formData.title) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/admin/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: formData.title, author: formData.author }),
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
        alert('فشل توليد المحتوى: ' + (err.error || 'خطأ غير معروف'));
      }
    } catch (err) {
      alert('خطأ في الاتصال أثناء توليد المحتوى');
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
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        alert('تم حفظ الكتاب بنجاح');
        setSelectedBook(null);
        fetchExistingBooks();
      } else {
        const err = await res.json();
        alert('خطأ في الحفظ: ' + (err.error || 'تأكد من إنشاء الجداول في Supabase'));
      }
    } catch (err) {
      alert('خطأ في الاتصال أثناء الحفظ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCategory = async () => {
    if (!newCategory.title) return;
    const payload = { ...newCategory, slug: slugify(newCategory.title) };
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        alert('تمت إضافة التصنيف');
        setNewCategory({ title: '', slug: '', description: '' });
        setShowCategoryForm(false);
        fetchCategories();
      } else {
        const err = await res.json();
        alert('خطأ: ' + (err.error || 'تأكد من إنشاء الجداول في Supabase'));
      }
    } catch (e) {
      alert('خطأ في الاتصال');
    }
  };

  const handleSaveAuthor = async () => {
    if (!newAuthor.name) return;
    const payload = { ...newAuthor, slug: slugify(newAuthor.name) };
    try {
      const res = await fetch('/api/admin/authors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        alert('تمت إضافة المؤلف');
        setNewAuthor({ name: '', slug: '', bio: '' });
        setShowAuthorForm(false);
        fetchAuthors();
      } else {
        const err = await res.json();
        alert('خطأ: ' + (err.error || 'تأكد من إنشاء الجداول في Supabase'));
      }
    } catch (e) {
      alert('خطأ في الاتصال');
    }
  };

  // --- Smart Suggestion Handlers ---

  const handleSuggestBooks = async (category: Category) => {
    setSelectedCategoryForSuggestions(category);
    setIsSuggesting(true);
    setSuggestions([]);
    setSelectedSuggestions(new Set());
    setCurrentPage(1);

    try {
      const res = await fetch('/api/admin/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: category.title, categorySlug: category.slug }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      } else {
        const err = await res.json();
        alert('فشل جلب الاقتراحات: ' + (err.error || 'خطأ غير معروف'));
      }
    } catch (err) {
      alert('خطأ في الاتصال أثناء جلب الاقتراحات');
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

  const handleBulkAdd = async () => {
    if (!selectedCategoryForSuggestions || selectedSuggestions.size === 0) return;

    setIsBulkAdding(true);

    const selectedBooks = suggestions.filter(s => selectedSuggestions.has(s.id));

    try {
      const res = await fetch('/api/admin/books/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          books: selectedBooks,
          category: selectedCategoryForSuggestions.title,
          categorySlug: selectedCategoryForSuggestions.slug
        }),
      });

      if (res.ok) {
        alert('تمت إضافة الكتب بنجاح');
        setSelectedCategoryForSuggestions(null);
        fetchExistingBooks();
      } else {
        const err = await res.json();
        alert('فشل الإضافة الجماعية: ' + (err.error || 'خطأ غير معروف'));
      }
    } catch (err) {
      alert('خطأ في الاتصال أثناء الإضافة الجماعية');
    } finally {
      setIsBulkAdding(false);
    }
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
                categorySlug: selectedCategoryForSuggestions.slug
            }),
        });

        if (res.ok) {
            setSuggestions(prev => prev.filter(s => !selectedSuggestions.has(s.id)));
            setSelectedSuggestions(new Set());
        }
    } catch (e) {}
  };

  // Pagination Logic
  const totalPages = Math.ceil(suggestions.length / ITEMS_PER_PAGE);
  const currentItems = suggestions.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gray-50 font-tajawal" dir="rtl">
      {/* Sidebar/Header */}
      <header className="bg-primary-900 text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-6 h-6 text-gold-400" />
            <h1 className="text-xl font-bold">لوحة تحكم موسوعة كنوز العلم</h1>
          </div>
          <button
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2 text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all"
          >
            <LogOut className="w-4 h-4" />
            الموقع الرئيسي
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Left Column: Search & Lists */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary-900">
              <Search className="w-5 h-5" />
              البحث في المكتبة العالمية (Archive)
            </h2>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث بالعنوان أو المؤلف..."
                className="flex-1 px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="bg-primary-900 text-white px-6 py-2 rounded-xl font-bold hover:bg-primary-800 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'بحث'}
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
                  تجهيز صفحة SEO احترافية
                </span>
                <button onClick={() => setSelectedBook(null)} className="text-sm text-gray-400 hover:text-gray-600">إلغاء</button>
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">العنوان (SEO Meta Title)</label>
                  <input
                    type="text"
                    value={formData.seoTitle}
                    onChange={(e) => setFormData({...formData, seoTitle: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">الرابط (Slug)</label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({...formData, slug: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none text-left"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">التصنيف</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                    >
                      {categories.map(c => (
                        <option key={c.slug} value={c.title}>{c.title}</option>
                      ))}
                      <option value="عام">عام</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">المؤلف</label>
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
                    <label className="block text-sm font-bold text-gray-700 mb-1">عدد الأجزاء</label>
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
                    <label className="block text-sm font-bold text-gray-700">وصف الكتاب (SEO Content)</label>
                    <button
                      onClick={generateContent}
                      disabled={isGenerating}
                      className="text-xs flex items-center gap-1 text-gold-600 hover:text-gold-700 font-bold bg-gold-50 px-2 py-1 rounded"
                    >
                      {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      توليد ذكي (Groq)
                    </button>
                  </div>
                  <textarea
                    rows={10}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none text-sm leading-relaxed"
                  />
                  <p className="text-[10px] text-gray-400 mt-1 italic">يفضل أن يكون الوصف بين 150 إلى 300 كلمة لضمان أفضل أرشفة.</p>
                </div>

                <button
                  onClick={handleSaveBook}
                  disabled={isSaving || !formData.description}
                  className="w-full bg-primary-900 text-white py-4 rounded-2xl font-bold hover:bg-primary-800 transition-all flex items-center justify-center gap-2 shadow-xl"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {existingBookIds.has(formData.archiveId) ? 'تحديث البيانات' : 'حفظ ونشر الصفحة'}
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
                    إدارة التصنيفات والاقتراحات الذكية
                  </h2>
                  <button
                    onClick={() => setShowCategoryForm(!showCategoryForm)}
                    className="text-xs bg-gold-50 text-gold-700 px-3 py-1 rounded-lg font-bold"
                  >
                    {showCategoryForm ? 'إلغاء' : 'إضافة تصنيف'}
                  </button>
                </div>

                {showCategoryForm && (
                  <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-xl border border-gold-100">
                    <input
                      placeholder="اسم التصنيف (مثال: كتب الحديث)"
                      className="w-full px-4 py-2 rounded-lg border border-gray-200"
                      value={newCategory.title}
                      onChange={e => setNewCategory({...newCategory, title: e.target.value})}
                    />
                    <textarea
                      placeholder="وصف التصنيف لـ SEO"
                      className="w-full px-4 py-2 rounded-lg border border-gray-200"
                      value={newCategory.description}
                      onChange={e => setNewCategory({...newCategory, description: e.target.value})}
                    />
                    <button
                      onClick={handleSaveCategory}
                      className="w-full bg-primary-900 text-white py-2 rounded-lg font-bold"
                    >
                      حفظ التصنيف
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-2">
                  {categories.map(c => (
                    <div key={c.slug} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-gold-300 transition-all">
                      <span className="font-bold text-gray-700">{c.title}</span>
                      <button
                        onClick={() => handleSuggestBooks(c)}
                        className="flex items-center gap-1 text-xs bg-gold-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-gold-700 transition-all shadow-sm"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        اقتراح كتب ذكية
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
                    إدارة المؤلفين
                  </h2>
                  <button
                    onClick={() => setShowAuthorForm(!showAuthorForm)}
                    className="text-xs bg-gold-50 text-gold-700 px-3 py-1 rounded-lg font-bold"
                  >
                    {showAuthorForm ? 'إلغاء' : 'إضافة مؤلف'}
                  </button>
                </div>

                {showAuthorForm && (
                  <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-xl border border-gold-100">
                    <input
                      placeholder="اسم المؤلف الكامل"
                      className="w-full px-4 py-2 rounded-lg border border-gray-200"
                      value={newAuthor.name}
                      onChange={e => setNewAuthor({...newAuthor, name: e.target.value})}
                    />
                    <textarea
                      placeholder="نبذة مختصرة عن المؤلف لصفحة SEO"
                      className="w-full px-4 py-2 rounded-lg border border-gray-200"
                      value={newAuthor.bio}
                      onChange={e => setNewAuthor({...newAuthor, bio: e.target.value})}
                    />
                    <button
                      onClick={handleSaveAuthor}
                      className="w-full bg-primary-900 text-white py-2 rounded-lg font-bold"
                    >
                      حفظ المؤلف
                    </button>
                  </div>
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
                <h3 className="text-xl font-bold text-primary-900 mb-2">النظام الذكي جاهز</h3>
                <p className="text-gray-600 text-sm">استخدم زر &quot;اقتراح كتب ذكية&quot; لإضافة محتوى احترافي بسرعة فائقة بالاعتماد على الذكاء الاصطناعي.</p>
              </div>
            </div>
          )}
        </div>

      </main>

      {/* Suggested Books Modal */}
      {selectedCategoryForSuggestions && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-primary-900 text-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Zap className="w-6 h-6 text-gold-400" />
                  اقتراحات ذكية لتصنيف: {selectedCategoryForSuggestions.title}
                </h2>
                <p className="text-xs text-primary-100 mt-1">تم جلب وتصفية {suggestions.length} كتاباً بالذكاء الاصطناعي.</p>
              </div>
              <button
                onClick={() => setSelectedCategoryForSuggestions(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                disabled={isBulkAdding}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {isSuggesting ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-500">
                  <Loader2 className="w-12 h-12 animate-spin text-gold-500" />
                  <p className="font-bold text-center px-4">جاري تحليل مئات الكتب وترتيبها بالذكاء الاصطناعي... يرجى الانتظار</p>
                </div>
              ) : suggestions.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                  <Library className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>لم يتم العثور على اقتراحات جديدة لهذا التصنيف حالياً.</p>
                </div>
              ) : (
                <>
                    <div className="space-y-4">
                        {currentItems.map((s) => (
                        <div
                            key={s.id}
                            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${selectedSuggestions.has(s.id) ? 'border-gold-500 bg-gold-50/50' : 'border-gray-100 hover:border-gray-200 bg-gray-50/30'}`}
                            onClick={() => toggleSuggestionSelection(s.id)}
                        >
                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${selectedSuggestions.has(s.id) ? 'bg-gold-500 border-gold-500 text-white' : 'border-gray-300'}`}>
                                {selectedSuggestions.has(s.id) && <CheckCircle className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 line-clamp-1">{s.title}</h4>
                            <p className="text-sm text-gray-500 truncate">{s.author}</p>
                            </div>
                            <div className="text-left flex-shrink-0">
                                <span className="text-[10px] font-bold px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                    ارتباط {s.relevance_score}%
                                </span>
                            </div>
                        </div>
                        ))}
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
                        <ChevronRight className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-bold text-gray-600">صفحة {currentPage} من {totalPages}</span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 bg-white rounded-lg border border-gray-200 disabled:opacity-30"
                    >
                        <ChevronLeft className="w-5 h-5" />
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
                            استبعاد المختارة
                        </button>
                        <p className="text-sm text-gray-500 self-center">تم اختيار {selectedSuggestions.size} كتاباً</p>
                    </div>

                    <button
                    onClick={handleBulkAdd}
                    disabled={selectedSuggestions.size === 0 || isBulkAdding}
                    className="px-10 py-3 bg-primary-900 text-white rounded-xl font-bold hover:bg-primary-800 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
                    >
                    {isBulkAdding ? (
                        <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        جاري المعالجة...
                        </>
                    ) : (
                        <>
                        <Plus className="w-5 h-5" />
                        إضافة الكتب المختارة للنظام
                        </>
                    )}
                    </button>
                </div>
              </div>
            )}

            {isBulkAdding && (
              <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center p-10 text-center z-10">
                <Loader2 className="w-16 h-16 animate-spin text-gold-600 mb-6" />
                <h3 className="text-2xl font-bold text-primary-900 mb-2">جاري العمل على سحر الذكاء الاصطناعي...</h3>
                <p className="text-gray-600 max-w-md">نقوم الآن بجلب أفضل النسخ، توليد محتوى SEO احترافي، وبناء الصفحات آلياً. يرجى عدم إغلاق النافذة.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
