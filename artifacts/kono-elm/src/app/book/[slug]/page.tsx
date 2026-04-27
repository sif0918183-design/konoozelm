import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Download, User, Tag, ChevronRight, Book as BookIcon, Sparkles, Globe } from 'lucide-react';
import { getBookByArchiveId, getBooksByCategory, getBooksByAuthor, getAuthorBySlug } from '@/lib/seo-data';
import { getBookDetails } from '@/lib/archive-api';

export const revalidate = 600;
import BookCard from '@/components/BookCard';
import { slugify } from '@/lib/utils';
import { translations } from '@/lib/translations';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { generateBookDescription } from '@/lib/groq';
import Logo from '@/components/Logo';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const parts = params.slug.split('--');
  const archiveId = parts[parts.length - 1];

  const seoBook = await getBookByArchiveId(archiveId, 'ar');
  const archiveDetails = await getBookDetails(archiveId);

  if (!seoBook && !archiveDetails) return { title: 'Book Not Found' };

  let title = seoBook?.seoTitle;
  let description = seoBook?.description;

  // If not in database, try to generate using Groq for better SEO metadata
  if (!description && archiveDetails) {
    try {
      const generated = await generateBookDescription(archiveDetails.title, archiveDetails.author || 'غير معروف');
      title = title || generated.seoTitle;
      description = generated.description;
    } catch (e) {
      title = title || `تحميل كتاب ${archiveDetails.title} PDF وقراءته أونلاين - موسوعة كنوز العلم`;
      description = archiveDetails.description || `قراءة وتحميل كتاب ${archiveDetails.title} للمؤلف ${archiveDetails.author || 'غير معروف'} بصيغة PDF مجاناً.`;
    }
  }

  title = title || `تحميل كتاب ${archiveDetails?.title || 'كتاب'} PDF وقراءته أونلاين - موسوعة كنوز العلم`;
  description = description || `قراءة وتحميل كتاب ${archiveDetails?.title} للمؤلف ${archiveDetails?.author || 'غير معروف'} بصيغة PDF مجاناً.`;

  return {
    title,
    description: description.substring(0, 160),
    alternates: {
      canonical: `https://kono-elm.vercel.app/book/${params.slug}`,
      languages: {
        'ar': `https://kono-elm.vercel.app/book/${params.slug}`,
        'en': `https://kono-elm.vercel.app/en/book/${params.slug}`,
      },
    },
    openGraph: {
      title: seoBook?.title || archiveDetails?.title,
      description: description.substring(0, 160),
      type: 'book',
      images: [archiveDetails?.coverImage || ''],
    },
  };
}

export default async function BookPage({ params }: Props) {
  const lang = 'ar';
  const t = translations[lang];
  const parts = params.slug.split('--');
  const archiveId = parts[parts.length - 1];

  const seoBook = await getBookByArchiveId(archiveId, lang);
  const archiveBook = await getBookDetails(archiveId);

  if (!archiveBook && !seoBook) notFound();

  const displayTitle = seoBook?.title || archiveBook?.title || 'Untitled';
  const displayAuthor = seoBook?.author || archiveBook?.author || 'غير معروف';
  const authorSlug = slugify(displayAuthor);
  const displayCategory = seoBook?.category || 'عام';
  const categorySlug = seoBook?.category_slug || slugify(displayCategory);

  // Mandatory content logic (Fallback)
  let displayDescription = seoBook?.description;
  let dynamicSeoTitle = seoBook?.seoTitle;

  if (!displayDescription && archiveBook) {
    try {
      const generated = await generateBookDescription(displayTitle, displayAuthor);
      displayDescription = generated.description;
      dynamicSeoTitle = generated.seoTitle;
    } catch (e) {
      displayDescription = `يعتبر كتاب ${displayTitle} من الكتب القيمة والمهمة في بابه، حيث يقدم المؤلف ${displayAuthor} رؤية علمية ومنهجية متميزة. يهدف هذا الكتاب إلى تيسير الوصول للمعلومات الدقيقة لطلبة العلم والباحثين. يمكنك الآن تحميل نسخة PDF عالية الجودة أو القراءة مباشرة عبر متصفحك من خلال مكتبتنا الإلكترونية الشاملة.`;
    }
  }

  // Internal Links
  const [relatedBooks, authorBooks] = await Promise.all([
    getBooksByCategory(categorySlug, displayCategory, 12),
    getBooksByAuthor(displayAuthor, 12)
  ]);

  const otherBooks = [...relatedBooks, ...authorBooks]
    .filter(b => b.archiveId !== archiveId)
    .filter((v, i, a) => a.findIndex(t => t.archiveId === v.archiveId) === i)
    .slice(0, 12);

  return (
    <div className="min-h-screen bg-[#fcfcf8] font-tajawal" dir="rtl">
      <header className="bg-primary-900 text-white pt-10 pb-8 px-4 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <Logo lang="ar" light className="scale-75 md:scale-90 origin-right" />
          </Link>
          <LanguageSwitcher light />
        </div>
      </header>

      {/* Breadcrumbs */}
      <nav className="max-w-7xl mx-auto px-4 py-4 mt-12 md:mt-0 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/" className="hover:text-primary-900 transition-colors">{t.home}</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href={`/${categorySlug}`} className="hover:text-primary-900 transition-colors">{displayCategory}</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium truncate">{displayTitle}</span>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8">

            {/* Right: Book Cover & Quick Info */}
            <div className="md:col-span-1 space-y-6">
              <div className="aspect-[3/4] bg-gray-100 rounded-2xl overflow-hidden relative shadow-md border border-gray-100">
                {archiveBook?.coverImage ? (
                  <Image
                    src={archiveBook.coverImage}
                    alt={displayTitle}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary-50">
                    <BookIcon className="w-20 h-20 text-primary-200" />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <Link href={`/author/${authorSlug}`} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gold-50 transition-colors">
                  <User className="w-5 h-5 text-gold-600" />
                  <div>
                    <p className="text-xs text-gray-400">{t.author}</p>
                    <p className="font-bold text-gray-900">{displayAuthor}</p>
                  </div>
                </Link>
                <Link href={`/${categorySlug}`} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gold-50 transition-colors">
                  <Tag className="w-5 h-5 text-gold-600" />
                  <div>
                    <p className="text-xs text-gray-400">{t.category}</p>
                    <p className="font-bold text-gray-900">{displayCategory}</p>
                  </div>
                </Link>
                {seoBook?.parts_count && seoBook.parts_count > 1 && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <BookIcon className="w-5 h-5 text-gold-600" />
                    <div>
                      <p className="text-xs text-gray-400">{t.parts}</p>
                      <p className="font-bold text-gray-900">{seoBook.parts_count}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Left: Description & Actions */}
            <div className="md:col-span-2 space-y-8">
              <div>
                <h1 className="text-3xl md:text-4xl font-amiri font-bold text-primary-900 mb-4 leading-tight">
                  {dynamicSeoTitle || displayTitle}
                </h1>
                <div className="mb-8 max-w-sm">
                  {archiveBook && (
                    <BookCard book={archiveBook} />
                  )}
                </div>
              </div>

              <div className="prose prose-lg max-w-none">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 border-r-4 border-gold-500 pr-4">{lang === 'ar' ? 'نبذة عن الكتاب' : 'About the Book'}</h2>
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {displayDescription}
                </div>
              </div>

              {/* Internal Linking: Related Content */}
              {otherBooks.length > 0 && (
                <div className="pt-12 border-t border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-gold-500" />
                    {lang === 'ar' ? 'قد يعجبك أيضاً' : 'You May Also Like'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {otherBooks.map(book => (
                      <Link
                        key={book.archiveId}
                        href={`/book/${book.slug}--${book.archiveId}`}
                        className="group p-4 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-md border border-transparent hover:border-gold-200 transition-all flex items-center gap-4"
                      >
                        <div className="w-12 h-16 bg-white rounded-lg flex items-center justify-center border border-gray-100 flex-shrink-0">
                          <BookIcon className="w-6 h-6 text-primary-300 group-hover:text-gold-500 transition-colors" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-gray-900 truncate group-hover:text-primary-900 transition-colors">{book.title}</h4>
                          <p className="text-xs text-gray-500 truncate">{book.author}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
