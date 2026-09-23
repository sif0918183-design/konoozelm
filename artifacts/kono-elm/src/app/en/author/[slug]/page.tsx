import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { User, Book as BookIcon, ChevronLeft } from 'lucide-react';
import { getAuthorBySlug, getBooksByAuthor } from '@/lib/seo-data';
import { translations } from '@/lib/translations';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Logo from '@/components/Logo';
import { getSiteUrl } from '@/lib/utils';
import { getShortSlug } from '@/lib/slug-utils';

export const revalidate = 600;

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = decodeURIComponent(params.slug);
  const author = await getAuthorBySlug(slug, 'en');
  if (!author) return { title: 'Author not found' };

  const siteUrl = getSiteUrl();

  return {
    title: `${author.name} - Books and Biography - Huda Library`,
    description: author.bio?.substring(0, 160) || `Books and biography of ${author.name}`,
    alternates: {
      canonical: `${siteUrl}/en/author/${params.slug}`,
      languages: {
        'ar': `${siteUrl}/author/${params.slug}`,
        'en': `${siteUrl}/en/author/${params.slug}`,
        'x-default': `${siteUrl}/en/author/${params.slug}`,
      },
    },
  };
}

export default async function EnglishAuthorPage({ params }: Props) {
  const lang = 'en';
  const t = translations[lang];
  const slug = decodeURIComponent(params.slug);
  const author = await getAuthorBySlug(slug, 'en');

  if (!author) notFound();

  const books = await getBooksByAuthor(author.name, 100, 'en');

  return (
    <div className="min-h-screen bg-[#fcfcf8] font-tajawal" dir="ltr">
      <header className="bg-primary-900 text-white pt-2 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 border-4 border-white/20 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 border-4 border-white/20 rounded-full translate-x-1/3 translate-y-1/3" />
        </div>

        <LanguageSwitcher light />

        <div className="max-w-4xl mx-auto text-center relative z-10 mt-8 md:mt-4 flex flex-col items-center">
          <Link href="/en" className="w-full mb-8 hover:opacity-90 transition-opacity">
            <Logo lang="en" />
          </Link>

          <div className="w-24 h-1 bg-gold-500/50 mx-auto mb-8 rounded-full" />

          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <User className="w-10 h-10 text-gold-200" />
          </div>
          <h1 className="text-4xl md:text-5xl font-playfair font-bold mb-6 text-white drop-shadow-sm">
            {author.name}
          </h1>
          <p className="text-lg text-primary-100/90 leading-relaxed max-w-2xl mx-auto font-medium">
            {author.bio || (lang === 'en' ? `Biography of ${author.name}` : `سيرة ${author.name}`)}
          </p>
        </div>
      </header>

      {/* Breadcrumbs */}
      <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/en" className="hover:text-primary-900 transition-colors">{t.home}</Link>
        <ChevronLeft className="w-4 h-4" />
        <span className="text-gray-900 font-medium">{author.name}</span>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-primary-900 mb-8 border-l-4 border-gold-500 pl-4">
          {lang === 'en' ? `Books by ${author.name}` : `كتب ${author.name}`}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {books.map((book) => {
            const bookSlug = book.new_slug || getShortSlug(book.title, book.archiveId, lang);
            return (
              <Link
                key={book.archiveId}
                href={`/en/book/${encodeURIComponent(bookSlug)}`}
                className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all border border-gray-100 hover:border-gold-200 flex flex-col h-full"
              >
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-gold-50 transition-colors">
                  <BookIcon className="w-6 h-6 text-primary-900 group-hover:text-gold-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2 group-hover:text-primary-900 transition-colors line-clamp-2">
                  {book.title}
                </h3>
                <div className="mt-auto flex items-center text-xs font-bold text-gold-600 group-hover:text-gold-700">
                  {t.read_more}
                  <ChevronLeft className="w-4 h-4 ml-1 group-hover:translate-x-[4px] transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>

        {books.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
            <BookIcon className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-bold mb-2">{lang === 'en' ? 'No books found for this author yet.' : 'لم يتم العثور على كتب لهذا المؤلف حالياً.'}</p>
          </div>
        )}
      </main>
    </div>
  );
}
