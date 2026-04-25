import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { User, Book as BookIcon, Globe, ChevronLeft } from 'lucide-react';
import { getAuthorBySlug, getBooksByAuthor } from '@/lib/seo-data';
import { translations } from '@/lib/translations';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = decodeURIComponent(params.slug);
  const author = await getAuthorBySlug(slug);
  if (!author) return { title: 'Author not found' };

  return {
    title: `${author.name} - Books and Biography - Kono Elm Encyclopedia`,
    description: author.bio?.substring(0, 160) || `Books and biography of ${author.name}`,
    alternates: {
      canonical: `https://kono-elm.vercel.app/en/author/${params.slug}`,
      languages: {
        'ar': `https://kono-elm.vercel.app/author/${params.slug}`,
        'en': `https://kono-elm.vercel.app/en/author/${params.slug}`,
      },
    },
  };
}

export default async function EnglishAuthorPage({ params }: Props) {
  const lang = 'en';
  const t = translations[lang];
  const slug = decodeURIComponent(params.slug);
  const author = await getAuthorBySlug(slug);

  if (!author) notFound();

  const books = await getBooksByAuthor(author.name, 100);

  return (
    <div className="min-h-screen bg-[#fcfcf8] font-tajawal" dir="ltr">
      <LanguageSwitcher />

      {/* Breadcrumbs */}
      <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/en" className="hover:text-primary-900 transition-colors">{t.home}</Link>
        <ChevronLeft className="w-4 h-4" />
        <span className="text-gray-900 font-medium">{author.name}</span>
      </nav>

      <header className="bg-primary-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-20 h-20 bg-gold-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
            <User className="w-10 h-10 text-primary-900" />
          </div>
          <h1 className="text-4xl md:text-5xl font-amiri font-bold mb-6 text-gold-200">
            {author.name}
          </h1>
          <p className="text-lg text-primary-100/90 leading-relaxed max-w-2xl mx-auto">
            {author.bio || (lang === 'en' ? `Biography of ${author.name}` : `سيرة ${author.name}`)}
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-primary-900 mb-8 border-l-4 border-gold-500 pl-4">
          {lang === 'en' ? `Books by ${author.name}` : `كتب ${author.name}`}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {books.map((book) => (
            <Link
              key={book.archiveId}
              href={`/en/book/${book.slug}--${book.archiveId}`}
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
          ))}
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
