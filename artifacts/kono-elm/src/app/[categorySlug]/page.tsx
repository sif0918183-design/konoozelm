import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, ChevronRight, Book as BookIcon, Globe } from 'lucide-react';
import { getCategoryBySlug, getBooksByCategory } from '@/lib/seo-data';
import SearchStateCleaner from '@/components/SearchStateCleaner';
import BookCard from '@/components/BookCard';

export const revalidate = 120;
import { translations } from '@/lib/translations';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Logo from '@/components/Logo';
import { getSiteUrl } from '@/lib/utils';
import Footer from '@/components/Footer';

interface Props {
  params: { categorySlug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = decodeURIComponent(params.categorySlug);
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: 'التصنيف غير موجود' };

  const siteUrl = getSiteUrl();

  return {
    title: `${category.title} - تحميل وقراءة كتب PDF`,
    description: category.description.substring(0, 160),
    alternates: {
      canonical: `${siteUrl}/${params.categorySlug}`,
      languages: {
        'ar': `${siteUrl}/${params.categorySlug}`,
        'en': `${siteUrl}/en/${params.categorySlug}`,
      },
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const lang = 'ar';
  const t = translations[lang];
  const slug = decodeURIComponent(params.categorySlug);
  const category = await getCategoryBySlug(slug, lang);

  if (!category) notFound();

  // Fetch up to 500 books to ensure all books in category are displayed
  const books = await getBooksByCategory(category.slug, category.title, 500, lang);

  return (
    <div className="min-h-screen bg-transparent font-tajawal" dir="rtl">
      <SearchStateCleaner />
      <header className="bg-primary-900 text-white pt-2 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 border-4 border-white/20 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 border-4 border-white/20 rounded-full translate-x-1/3 translate-y-1/3" />
        </div>

        <LanguageSwitcher light />

        <div className="max-w-4xl mx-auto text-center relative z-10 mt-8 md:mt-4 flex flex-col items-center">
          <Link href="/" className="w-full mb-8 hover:opacity-90 transition-opacity">
            <Logo lang="ar" />
          </Link>

          <div className="w-24 h-1 bg-gold-500/50 mx-auto mb-8 rounded-full" />

          <h1 className="text-4xl md:text-5xl font-amiri font-bold mb-6 text-white drop-shadow-sm">
            {category.title}
          </h1>
          <p className="text-lg text-primary-100/90 leading-relaxed max-w-2xl mx-auto font-medium">
            {category.description}
          </p>
        </div>
      </header>

      {/* Breadcrumbs */}
      <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/" className="hover:text-primary-900 transition-colors">{t.home}</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">{category.title}</span>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-12 -mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {books.map((book) => (
            <div key={book.archiveId}>
              <BookCard
                book={{
                  identifier: book.archiveId,
                  title: book.title,
                  author: book.author,
                  previewLink: `https://archive.org/details/${book.archiveId}`,
                  coverImage: `https://archive.org/services/img/${book.archiveId}`,
                }}
                initialSeoSlug={book.slug}
              />
            </div>
          ))}
        </div>

        {books.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
            <BookOpen className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-bold mb-2">{t.no_books_in_category}</p>
          </div>
        )}
      </main>
      <Footer lang="ar" />
    </div>
  );
}
