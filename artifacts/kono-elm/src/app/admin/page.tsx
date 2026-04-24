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
  AlertCircle
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

  useEffect(() => {
    fetchCategories();
    fetchAuthors();
    fetchExistingBooks();
  }, []);

  const fetchCategories = async () => {
    const res = await fetch('/api/admin/categories');
    if (res.ok) {
      const data = await res.json();
      setCategories(data);
    }
  };

  const fetchAuthors = async () => {
    const res = await fetch('/api/admin/authors');
    if (res.ok) {
      const data = await res.json();
      setAuthors(data);
    }
  };

  const fetchExistingBooks = async () => {
    const res = await fetch('/api/admin/books');
    if (res.ok) {
      const data: SeoBook[] = await res.json();
      setExistingBookIds(new Set(data.map(b => b.archiveId)));
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
      alert('خطأ في البحث');
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
      }
    } catch (err) {
      alert('خطأ في توليد المحتوى');
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
        alert('خطأ: ' + err.error);
      }
    } catch (err) {
      alert('خطأ في الحفظ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCategory = async () => {
    const payload = { ...newCategory, slug: slugify(newCategory.title) };
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
    }
  };

  const handleSaveAuthor = async () => {
    const payload = { ...newAuthor, slug: slugify(newAuthor.name) };
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
    }
  };

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

        {/* Right Column: Editing Forms */}
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

              {/* Category Management */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2 text-primary-900">
                    <FolderPlus className="w-5 h-5" />
                    إدارة التصنيفات
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

                <div className="flex flex-wrap gap-2">
                  {categories.map(c => (
                    <span key={c.slug} className="bg-white border border-gray-200 px-3 py-1 rounded-full text-xs text-gray-600 font-bold">
                      {c.title}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-gold-50 p-8 rounded-3xl border border-gold-200 text-center">
                <Sparkles className="w-12 h-12 text-gold-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-primary-900 mb-2">النظام جاهز للعمل</h3>
                <p className="text-gray-600 text-sm">اختر كتاباً من اليسار لبدء تجهيزه. الكتب المعلمة بالعلامة <CheckCircle className="inline w-3 h-3 text-green-500" /> موجودة بالفعل في النظام ويمكنك تعديلها.</p>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
