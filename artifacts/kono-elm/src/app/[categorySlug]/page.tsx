import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Tag, ChevronRight, Book as BookIcon } from 'lucide-react';
import { getCategoryBySlug, getBooksByCategory } from '@/lib/seo-data';

interface Props {
  params: { categorySlug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await getCategoryBySlug(params.categorySlug);
  if (!category) return { title: 'Category Not Found' };

  return {
    title: `${category.title} - تحميل وقراءة كتب PDF`,
    description: category.description.substring(0, 160),
  };
}

export default async function CategoryPage({ params }: Props) {
  const category = await getCategoryBySlug(params.categorySlug);
  if (!category) notFound();

  const books = await getBooksByCategory(category.slug);

  return (
    <div className="min-h-screen bg-[#fcfcf8] font-tajawal" dir="rtl">
      {/* Breadcrumbs */}
      <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/" className="hover:text-primary-900 transition-colors">الرئيسية</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">{category.title}</span>
      </nav>

      <header className="bg-primary-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-amiri font-bold mb-6 text-gold-200">
            {category.title}
          </h1>
          <p className="text-lg text-primary-100/90 leading-relaxed max-w-2xl mx-auto">
            {category.description}
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12 -mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {books.map((book) => (
            <Link
              key={book.slug}
              href={`/book/${book.slug}`}
              className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all border border-gray-100 hover:border-gold-200 flex flex-col h-full"
            >
              <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-gold-50 transition-colors">
                <BookIcon className="w-6 h-6 text-primary-900 group-hover:text-gold-600" />
              </div>
              <h2 className="font-bold text-gray-900 mb-2 group-hover:text-primary-900 transition-colors line-clamp-2">
                {book.title}
              </h2>
              <p className="text-sm text-gray-500 mb-4">{book.author}</p>
              <div className="mt-auto flex items-center text-xs font-bold text-gold-600 group-hover:text-gold-700">
                اقرأ المزيد
                <ChevronRight className="w-4 h-4 mr-1 group-hover:translate-x-[-4px] transition-transform" />
              </div>
            </Link>
          ))}
        </div>

        {books.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
            <BookOpen className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد كتب في هذا التصنيف حالياً</p>
          </div>
        )}
      </main>
    </div>
  );
}
