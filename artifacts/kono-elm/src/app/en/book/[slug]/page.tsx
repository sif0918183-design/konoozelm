import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, User, Tag, ChevronLeft, Book as BookIcon, Sparkles, Globe } from 'lucide-react';
import { getBookByArchiveId, getBooksByCategory, getBooksByAuthor } from '@/lib/seo-data';
import { getBookDetails, getOcrSnippet, generateSmartFallback } from '@/lib/archive-api';

export const revalidate = 600;
import BookCard from '@/components/BookCard';
import BookSeoLayer from '@/components/BookSeoLayer';
import BookSchema from '@/components/BookSchema';
import { generateEnglishSlug } from '@/lib/utils';
import { translations } from '@/lib/translations';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Logo from '@/components/Logo';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const parts = params.slug.split('--');
  const archiveId = parts[parts.length - 1];

  const seoBook = await getBookByArchiveId(archiveId, 'en');
  const archiveDetails = await getBookDetails(archiveId);

  if (!seoBook && !archiveDetails) return { title: 'Book Not Found' };

  let title = seoBook?.seoTitle;
  let description = seoBook?.description;

  title = title || `Download ${archiveDetails?.title || 'Book'} PDF - Read Online - Huda Library`;
  description = description || `Read and download ${archiveDetails?.title} by ${archiveDetails?.author || 'Unknown'} in PDF format for free.`;

  return {
    title,
    description: description.substring(0, 160),
    alternates: {
      canonical: `https://kono-elm.vercel.app/en/book/${params.slug}`,
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

export default async function EnglishBookPage({ params }: Props) {
  const lang = 'en';
  const t = translations[lang];
  const parts = params.slug.split('--');
  const archiveId = parts[parts.length - 1];

  const seoBook = await getBookByArchiveId(archiveId, lang);
  const archiveBook = await getBookDetails(archiveId);

  if (!archiveBook && !seoBook) notFound();

  const ocrSnippet = archiveBook?.ocrUrl ? await getOcrSnippet(archiveBook.ocrUrl) : null;

  const displayTitle = seoBook?.title || archiveBook?.title || 'Untitled';
  const displayAuthor = seoBook?.author || archiveBook?.author || 'Unknown';
  const authorSlug = generateEnglishSlug(displayAuthor);
  const displayCategory = seoBook?.category || 'General';
  const categorySlug = seoBook?.category_slug || generateEnglishSlug(displayCategory);

  let displayDescription = seoBook?.description || `The book ${displayTitle} is one of the valuable and important works in its field. Author ${displayAuthor} provides a distinguished scientific and methodological vision. This book aims to facilitate access to accurate information for students of knowledge and researchers. You can now download a high-quality PDF version or read directly through your browser through our comprehensive electronic library.`;
  let dynamicSeoTitle = seoBook?.seoTitle;

  // Internal Links - Restricted to same category as requested
  const otherBooks = await getBooksByCategory(categorySlug, displayCategory, 12, lang)
    .then(books => books.filter(b => b.archiveId !== archiveId));

  return (
    <div className="min-h-screen bg-[#fcfcf8] font-tajawal" dir="ltr">
      <header className="bg-primary-900 text-white pt-2 pb-12 px-4 relative overflow-hidden">
        <LanguageSwitcher light />
        <div className="max-w-7xl mx-auto flex flex-col items-center mt-8 md:mt-4">
          <Link href="/en" className="w-full hover:opacity-90 transition-opacity">
            <Logo lang="en" />
          </Link>
        </div>
      </header>

      <BookSchema
        book={{
          title: displayTitle,
          author: displayAuthor,
          description: displayDescription || '',
          language: lang,
          category: displayCategory,
          coverImage: archiveBook?.coverImage,
          datePublished: archiveBook?.year,
          publisher: archiveBook?.publisher,
          identifier: archiveId,
          url: `https://hudalibrary.com/en/book/${params.slug}`,
          excerpt: ocrSnippet || undefined,
          keywords: `${displayTitle}, ${displayAuthor}, ${displayCategory}, Islamic Books PDF, Huda Library`,
          about: displayDescription?.substring(0, 300)
        }}
      />

      {/* Breadcrumbs */}
      <nav className="max-w-7xl mx-auto px-4 py-4 mt-12 md:mt-0 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/en" className="hover:text-primary-900 transition-colors">{t.home}</Link>
        <ChevronLeft className="w-4 h-4" />
        <Link href={`/en/${categorySlug}`} className="hover:text-primary-900 transition-colors">{displayCategory}</Link>
        <ChevronLeft className="w-4 h-4" />
        <span className="text-gray-900 font-medium truncate">{displayTitle}</span>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8">

            {/* Book Cover & Quick Info */}
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
                <Link href={`/en/author/${authorSlug}`} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gold-50 transition-colors">
                  <User className="w-5 h-5 text-gold-600" />
                  <div>
                    <p className="text-xs text-gray-400">{t.author}</p>
                    <p className="font-bold text-gray-900">{displayAuthor}</p>
                  </div>
                </Link>
                <Link href={`/en/${categorySlug}`} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gold-50 transition-colors">
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

            {/* Description & Actions */}
            <div className="md:col-span-2 space-y-8">
              <div>
                <h1 className="text-3xl md:text-4xl font-amiri font-bold text-primary-900 mb-4 leading-tight">
                  {dynamicSeoTitle || displayTitle}
                </h1>
                <div className="mb-8 max-w-md">
                  {archiveBook && (
                    <BookCard book={archiveBook} lang="en" />
                  )}
                </div>
              </div>

              <div className="prose prose-lg max-w-none">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 border-l-4 border-gold-500 pl-4">{lang === 'en' ? 'About the Book' : 'نبذة عن الكتاب'}</h2>
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {displayDescription}
                </div>
              </div>

              {/* OCR SEO Layer */}
              <BookSeoLayer
                ocrSnippet={ocrSnippet}
                fallbackText={generateSmartFallback({
                  identifier: archiveId,
                  title: displayTitle,
                  author: displayAuthor,
                  publisher: archiveBook?.publisher,
                  description: displayDescription
                }, lang)}
                lang={lang}
                archiveId={archiveId}
                slug={params.slug}
              />

              {/* Internal Linking: Related Content */}
              {otherBooks.length > 0 && (
                <div className="pt-12 border-t border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-gold-500" />
                    {lang === 'en' ? 'You May Also Like' : 'قد يعجبك أيضاً'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {otherBooks.map(book => (
                      <Link
                        key={book.archiveId}
                        href={`/en/book/${book.slug}--${book.archiveId}`}
                        className="group p-4 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-md border border-transparent hover:border-gold-200 transition-all flex items-center gap-4"
                      >
                        <div className="w-12 h-16 bg-white rounded-lg flex items-center justify-center border border-gray-100 flex-shrink-0">
                          <BookIcon className="w-6 h-6 text-primary-300 group-hover:text-gold-500 transition-colors" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-gray-900 group-hover:text-primary-900 transition-colors line-clamp-4 break-words leading-snug" title={book.title}>
                            {book.title}
                          </h4>
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
