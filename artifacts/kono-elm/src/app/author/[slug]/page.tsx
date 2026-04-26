import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { User, Book as BookIcon, ChevronRight, Globe } from 'lucide-react';
import { getAuthorBySlug, getBooksByAuthor } from '@/lib/seo-data';
import SearchStateCleaner from '@/components/SearchStateCleaner';

export const revalidate = 600;
import { translations } from '@/lib/translations';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const decodedSlug = decodeURIComponent(params.slug);
  const author = await getAuthorBySlug(decodedSlug);
  if (!author) return { title: 'المؤلف غير موجود' };

  return {
    title: `كتب ومؤلفات ${author.name} - تحميل وقراءة PDF`,
    description: author.bio?.substring(0, 160) || `جميع كتب ومؤلفات ${author.name} متاحة للتحميل والقراءة مجاناً.`,
    alternates: {
      canonical: `https://kono-elm.vercel.app/author/${params.slug}`,
      languages: {
        'ar': `https://kono-elm.vercel.app/author/${params.slug}`,
        'en': `https://kono-elm.vercel.app/en/author/${params.slug}`,
      },
    },
  };
}

export default async function AuthorPage({ params }: Props) {
  const lang = 'ar';
  const t = translations[lang];
  const decodedSlug = decodeURIComponent(params.slug);
  const author = await getAuthorBySlug(decodedSlug, lang);

  if (!author) notFound();

  const books = await getBooksByAuthor(author.name);

  return (
    <div className="min-h-screen bg-[#fcfcf8] font-tajawal" dir="rtl">
      <SearchStateCleaner />
      <LanguageSwitcher />

      <nav className="max-w-7xl mx-auto px-4 py-4 mt-12 md:mt-0 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/" className="hover:text-primary-900 transition-colors">{t.home}</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">{author.name}</span>
      </nav>

      <header className="bg-primary-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full mb-6">
            <User className="w-10 h-10 text-gold-200" />
          </div>
          <h1 className="text-4xl md:text-5xl font-amiri font-bold mb-6 text-gold-200">
            {author.name}
          </h1>
          {author.bio && (
            <p className="text-lg text-primary-100/90 leading-relaxed max-w-2xl mx-auto">
              {author.bio}
            </p>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12 -mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 border-r-4 border-gold-500 pr-4">
          {lang === 'ar' ? `مؤلفات ${author.name}` : `Works by ${author.name}`}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {books.map((book) => (
            <Link
              key={book.archiveId}
              href={`/book/${book.slug}--${book.archiveId}`}
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
                <ChevronRight className="w-4 h-4 mr-1 group-hover:translate-x-[-4px] transition-transform" />
              </div>
            </Link>
          ))}
        </div>

        {books.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
            <User className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500">{lang === 'ar' ? 'لا توجد كتب مضافة لهذا المؤلف حالياً' : 'No books found for this author yet.'}</p>
          </div>
        )}
      </main>
    </div>
  );
}
