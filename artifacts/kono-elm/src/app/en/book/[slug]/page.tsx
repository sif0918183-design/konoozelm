import { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, User, Tag, ChevronLeft, Book as BookIcon, Sparkles, Globe, HelpCircle } from 'lucide-react';
import { getBookByArchiveId, getBooksByCategory, getBooksByAuthor, getBookBySlug, getBookBySuffix, saveSeoBook, saveCategory } from '@/lib/seo-data';
import { getBookDetails, getBookFiles } from '@/lib/archive-api';
import BookCard from '@/components/BookCard';

export const revalidate = 600;
import { generateEnglishSlug, getSiteUrl, isAuthorUnknown } from '@/lib/utils';
import { getShortSlug, isNewDeterministicSlug, extractSuffix } from '@/lib/slug-utils';
import { translations } from '@/lib/translations';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { generateBookDescription } from '@/lib/groq';
import Logo from '@/components/Logo';
import BookSchema from '@/components/BookSchema';
import Footer from '@/components/Footer';
import AdverticaAd from '@/components/AdverticaAd';

interface Props {
  params: { slug: string };
}

const cleanDescription = (description: string) => {
  if (!description) return '';
  // Remove common "Unknown Author" prefixes in English
  const prefixes = [
    /^The book (.*?) is written by Unknown/i,
    /^The book (.*?) is written by غير معروف/i,
    /^The book (.*?) by Unknown/i,
    /^Author Unknown provides/i
  ];

  let cleaned = description;
  // If it starts with "The book [Title] is written by Unknown", try to replace it
  cleaned = cleaned.replace(/^The book (.*?) is written by (Unknown|غير معروف)\.?/i, 'The book $1 is a valuable work.');
  cleaned = cleaned.replace(/^The book (.*?) by (Unknown|غير معروف) is/i, 'The book $1 is');

  return cleaned;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  let archiveId: string | undefined;

  // 1. Try by exact slug or suffix
  const decodedSlug = decodeURIComponent(params.slug);
  let seoBook = await getBookBySlug(decodedSlug, 'en');

  if (!seoBook) {
    const suffix = extractSuffix(decodedSlug);
    if (suffix) {
      seoBook = await getBookBySuffix(suffix, 'en');
    }
  }

  if (seoBook) {
    archiveId = seoBook.archiveId;
  } else if (decodedSlug.includes('--')) {
    archiveId = decodedSlug.split('--').pop();
  }

  if (!archiveId) return { title: 'Book Not Found' };

  const archiveDetails = await getBookDetails(archiveId);
  if (!seoBook && !archiveDetails) return { title: 'Book Not Found' };

  let title = seoBook?.seoTitle;
  let description = seoBook?.description;

  // If not in database, try to generate using Groq for better SEO metadata
  if (!description && archiveDetails) {
    try {
      const generated = await generateBookDescription(archiveDetails.title, archiveDetails.author || 'Unknown', 'en', seoBook?.category, undefined, archiveDetails.description, archiveId);
      title = title || generated.seoTitle;
      description = generated.description;
    } catch (e) {
      title = title || `Download ${archiveDetails.title} PDF - Read Online - Huda Library`;
      description = archiveDetails.description || `Read and download ${archiveDetails.title} by ${archiveDetails.author || 'Unknown'} in PDF format for free.`;
    }
  }

  title = title || `Download ${archiveDetails?.title || 'Book'} PDF - Read Online - Huda Library`;

  const authorName = archiveDetails?.author;
  const hasAuthor = !isAuthorUnknown(authorName);

  description = description || (hasAuthor
    ? `Read and download ${archiveDetails?.title} by ${authorName} in PDF format for free.`
    : `Read and download ${archiveDetails?.title} in PDF format for free online.`);

  const siteUrl = getSiteUrl();

  const arIdeal = getShortSlug(title || archiveDetails?.title || '', archiveId, 'ar');
  const enIdeal = getShortSlug(title || archiveDetails?.title || '', archiveId, 'en');

  return {
    title,
    description: description.substring(0, 160),
    alternates: {
      canonical: `${siteUrl}/en/book/${encodeURIComponent(seoBook?.new_slug || enIdeal)}`,
      languages: {
        'ar': `${siteUrl}/book/${encodeURIComponent(seoBook?.new_slug || arIdeal)}`,
        'en': `${siteUrl}/en/book/${encodeURIComponent(seoBook?.new_slug || enIdeal)}`,
        'x-default': `${siteUrl}/en/book/${encodeURIComponent(seoBook?.new_slug || enIdeal)}`,
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
  const decodedSlug = decodeURIComponent(params.slug);

  let seoBook;
  let archiveId: string | null = null;

  // 1. PRIMARY LOOKUP: Precise & Fast
  try {
    seoBook = await getBookBySlug(decodedSlug, lang);

    if (!seoBook) {
      const suffix = extractSuffix(decodedSlug);
      if (suffix) {
        seoBook = await getBookBySuffix(suffix, lang);
      }
    }

    if (seoBook) {
      archiveId = seoBook.archiveId;
    } else if (decodedSlug.includes('--')) {
      // 2. LEGACY FALLBACK: Extract from title--id
      archiveId = decodedSlug.split('--').pop() || null;
      if (archiveId) {
        seoBook = await getBookByArchiveId(archiveId, lang);
      }
    }
  } catch (error) {
    console.error('Lookup Error:', error);
  }

  // 3. REDIRECT CHECK FOR EXISTING BOOKS IN DB
  if (seoBook) {
    const idealSlug = getShortSlug(seoBook.title, seoBook.archiveId, lang);
    const isLegacy = decodedSlug.includes('--') || (seoBook.slug === decodedSlug && seoBook.new_slug && seoBook.new_slug !== decodedSlug);

    if (isLegacy || (decodedSlug !== idealSlug && !isNewDeterministicSlug(decodedSlug))) {
       try {
         console.log(`[JIT-EN] Migrating to new_slug: ${decodedSlug} -> ${idealSlug}`);
         await saveSeoBook({
           ...seoBook,
           new_slug: idealSlug,
           suffix: extractSuffix(idealSlug) || undefined
         });
       } catch (e) {
         console.error('JIT Migration failed:', e);
       }
       permanentRedirect(`/en/book/${encodeURIComponent(idealSlug)}`);
    }
  } else if (decodedSlug.includes('--')) {
    // Ephemeral on-the-fly generation for books from search results not in DB
    archiveId = decodedSlug.split('--').pop() || null;
  }

  // 5. DATA FETCHING (for normal display or JIT fallback)
  let archiveBook;
  if (archiveId) {
    try {
      archiveBook = await getBookDetails(archiveId);
    } catch (error) {
      console.error('Archive Error:', error);
    }
  }

  if (!archiveBook && !seoBook) notFound();

  const displayTitle = seoBook?.title || archiveBook?.title || 'Untitled';
  const finalArchiveId = (seoBook?.archiveId || archiveBook?.identifier || archiveId) as string;

  // Final redirect check for legacy slugs
  const idealSlug = getShortSlug(displayTitle, finalArchiveId, lang);
  if (decodedSlug !== idealSlug && (decodedSlug.includes('--') || !isNewDeterministicSlug(decodedSlug))) {
     permanentRedirect(`/en/book/${encodeURIComponent(idealSlug)}`);
  }
  const displayAuthor = seoBook?.author || archiveBook?.author || 'Unknown';
  const hasAuthor = !isAuthorUnknown(displayAuthor);
  const authorSlug = generateEnglishSlug(displayAuthor);
  const displayCategory = seoBook?.category || '';
  const categorySlug = seoBook?.category_slug || (displayCategory ? generateEnglishSlug(displayCategory) : '');

  let displayDescription = seoBook?.description ? cleanDescription(seoBook.description) : undefined;
  let dynamicSeoTitle = seoBook?.seoTitle;

  if (!displayDescription && archiveBook) {
    try {
      const generated = await generateBookDescription(displayTitle, displayAuthor, 'en', displayCategory, undefined, archiveBook.description, finalArchiveId);
      displayDescription = generated.description;
      dynamicSeoTitle = generated.seoTitle;
    } catch (e) {
      displayDescription = hasAuthor
        ? `The book ${displayTitle} is one of the valuable and important works in its field. Author ${displayAuthor} provides a distinguished scientific and methodological vision. This book aims to facilitate access to accurate information for students of knowledge and researchers. You can now download a high-quality PDF version or read directly through your browser through our comprehensive electronic library.`
        : `The book ${displayTitle} is one of the valuable and important works in its field. It provides a distinguished scientific and methodological vision. This book aims to facilitate access to accurate information for students of knowledge and researchers. You can now download a high-quality PDF version or read directly through your browser through our comprehensive electronic library.`;
    }
  }

  // Internal Links - Restricted to same category as requested
  const otherBooks = await getBooksByCategory(categorySlug, displayCategory, 12, lang)
    .then(books => books.filter(b => b.archiveId !== finalArchiveId));

  const bookFiles = await getBookFiles(finalArchiveId);

  // Generate FAQ items
  const faqItems = [
    {
      question: `What is the book ${displayTitle}?`,
      answer: hasAuthor
        ? `The book ${displayTitle} is written by ${displayAuthor} and is categorized under ${displayCategory}. It is considered a valuable resource in its field.`
        : `The book ${displayTitle} is categorized under ${displayCategory}. It is considered a valuable resource in its field providing deep knowledge for researchers.`
    },
    {
      question: `How can I download ${displayTitle} PDF?`,
      answer: `You can download ${displayTitle} in PDF format directly from this page by clicking the download button. You can also read it online for free.`
    },
    {
      question: `Is it free to read ${displayTitle}?`,
      answer: `Yes, Huda Library provides free access to read and download ${displayTitle} and all its Islamic books and manuscripts for researchers and students.`
    }
  ];

  const siteUrl = getSiteUrl();

  const breadcrumbs = [
    { name: t.home, item: `${siteUrl}/en` },
    ...(displayCategory ? [{ name: displayCategory, item: `${siteUrl}/en/${categorySlug}` }] : []),
    { name: displayTitle, item: `${siteUrl}/en/book/${encodeURIComponent(idealSlug)}` }
  ];

  return (
    <div className="min-h-screen bg-[#fcfcf8] font-tajawal" dir="ltr">
      <BookSchema
        book={{
          title: dynamicSeoTitle || displayTitle,
          author: displayAuthor,
          description: displayDescription || '',
          image: archiveBook?.coverImage,
          url: `${siteUrl}/en/book/${encodeURIComponent(idealSlug)}`,
          category: displayCategory,
          categoryUrl: `${siteUrl}/en/${categorySlug}`
        }}
        breadcrumbs={breadcrumbs}
        faq={faqItems}
        lang="en"
      />
      <header className="bg-primary-900 text-white pt-2 pb-12 px-4 relative overflow-hidden">
        <LanguageSwitcher light />
        <div className="max-w-7xl mx-auto flex flex-col items-center mt-8 md:mt-4">
          <Link href="/en" className="w-full hover:opacity-90 transition-opacity">
            <Logo lang="en" />
          </Link>
        </div>
      </header>

      {/* Breadcrumbs */}
      <nav className="max-w-7xl mx-auto px-4 py-4 mt-12 md:mt-0 flex items-center gap-2 text-sm text-gray-500" aria-label="Breadcrumb">
        <Link href="/en" className="hover:text-primary-900 transition-colors">{t.home}</Link>
        <ChevronLeft className="w-4 h-4" />
        <Link href={`/en/${categorySlug}`} className="hover:text-primary-900 transition-colors">{displayCategory}</Link>
        <ChevronLeft className="w-4 h-4" />
        <span className="text-gray-900 font-medium truncate" aria-current="page">{displayTitle}</span>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <article className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8">

            {/* Book Cover & Quick Info */}
            <aside className="md:col-span-1 space-y-6">
              <div className="aspect-[3/4] bg-gray-100 rounded-2xl overflow-hidden relative shadow-md border border-gray-100">
                {archiveBook?.coverImage ? (
                  <Image
                    src={archiveBook.coverImage}
                    alt={displayTitle}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary-50">
                    <BookIcon className="w-20 h-20 text-primary-200" />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {hasAuthor && (
                  <Link href={`/en/author/${authorSlug}`} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gold-50 transition-colors">
                    <User className="w-5 h-5 text-gold-600" />
                    <div>
                      <p className="text-xs text-gray-400">{t.author}</p>
                      <p className="font-bold text-gray-900">{displayAuthor}</p>
                    </div>
                  </Link>
                )}
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

              {/* Desktop-only sidebar ad slot placed directly under category info */}
              <AdverticaAd className="hidden md:flex my-4" />

              {/* Vertical Stacked Sidebar Ad Placement */}
              <div className="space-y-4 mt-6">
                <AdverticaAd />
                <AdverticaAd />
              </div>
            </aside>

            {/* Description & Actions */}
            <div className="md:col-span-2 space-y-8">
              <section>
                <h1 className="text-3xl md:text-4xl font-amiri font-bold text-primary-900 mb-4 leading-tight">
                  {dynamicSeoTitle || displayTitle}
                </h1>
                <div className="mb-8 max-w-md">
                  {archiveBook && (
                    <BookCard
                      book={archiveBook}
                      lang="en"
                      initialFiles={bookFiles}
                      initialSeoSlug={seoBook?.slug}
                    />
                  )}
                </div>
              </section>

              <section className="prose prose-lg max-w-none">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 border-l-4 border-gold-500 pl-4">{lang === 'en' ? 'About the Book' : 'نبذة عن الكتاب'}</h2>
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {displayDescription}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  <AdverticaAd className="my-0" />
                  <AdverticaAd className="my-0 hidden sm:flex" />
                </div>
              </section>

              {/* FAQ Section */}
              <section className="pt-12 border-t border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <HelpCircle className="w-6 h-6 text-gold-500" />
                  {lang === 'en' ? 'Frequently Asked Questions' : 'الأسئلة الشائعة حول الكتاب'}
                </h2>
                <div className="space-y-4">
                  {faqItems.map((item, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                      <h3 className="text-lg font-bold text-primary-900 mb-2">{item.question}</h3>
                      <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Mid-content Multi Ad Placement */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-8">
                <AdverticaAd className="my-0" />
                <AdverticaAd className="my-0 hidden sm:flex" />
              </div>

              {/* Internal Linking: Related Content */}
              {otherBooks.length > 0 && (
                <section className="pt-12 border-t border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-gold-500" />
                    {lang === 'en' ? 'You May Also Like' : 'قد يعجبك أيضاً'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {otherBooks.map(book => (
                      <Link
                        key={book.archiveId}
                        href={`/en/book/${encodeURIComponent(getShortSlug(book.title, book.archiveId, lang))}`}
                        className="group p-4 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-md border border-transparent hover:border-gold-200 transition-all flex items-center gap-4"
                      >
                        <div className="w-12 h-16 bg-white rounded-lg flex items-center justify-center border border-gray-100 flex-shrink-0">
                          <BookIcon className="w-6 h-6 text-primary-300 group-hover:text-gold-500 transition-colors" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-gray-900 group-hover:text-primary-900 transition-colors line-clamp-4 break-words leading-snug" title={book.title}>
                            {book.title}
                          </h4>
                          {!isAuthorUnknown(book.author) && (
                            <p className="text-xs text-gray-500 truncate">{book.author}</p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                    <AdverticaAd className="my-0" />
                    <AdverticaAd className="my-0 hidden sm:flex" />
                  </div>
                </section>
              )}
            </div>

          </div>
        </article>
      </main>
      <Footer lang="en" />
    </div>
  );
}
