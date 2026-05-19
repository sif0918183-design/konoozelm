import { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, User, Tag, ChevronLeft, Book as BookIcon, Sparkles, Globe, HelpCircle } from 'lucide-react';
import { getBookByArchiveId, getBooksByCategory, getBooksByAuthor, getAuthorBySlug, getBookBySlug } from '@/lib/seo-data';
import { getBookDetails, getBookFiles } from '@/lib/archive-api';

export const revalidate = 600;
import BookCard from '@/components/BookCard';
import { generateEnglishSlug, getSiteUrl, isAuthorUnknown } from '@/lib/utils';
import { isOldStyleSlug, extractArchiveIdFromSlug } from '@/lib/slug-utils';
import { translations } from '@/lib/translations';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Logo from '@/components/Logo';
import BookSchema from '@/components/BookSchema';

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
  let seoBook = null;
  let archiveId = '';

  try {
    seoBook = await getBookBySlug(params.slug, 'en');
  } catch (e) {
    console.error('Error fetching seoBook by slug (EN):', e);
  }

  if (!seoBook && isOldStyleSlug(params.slug)) {
    const extractedId = extractArchiveIdFromSlug(params.slug);
    if (extractedId) {
      archiveId = extractedId;
      try {
        seoBook = await getBookByArchiveId(archiveId, 'en');
      } catch (e) {
        console.error('Error fetching seoBook by archiveId (EN):', e);
      }
    }
  }

  if (seoBook?.archiveId) {
    archiveId = seoBook.archiveId;
  }

  let archiveDetails = null;
  if (archiveId) {
    try {
      archiveDetails = await getBookDetails(archiveId);
    } catch (e) {
      console.error('Error fetching archiveDetails (EN):', e);
    }
  }

  if (!seoBook && !archiveDetails) return { title: 'Book Not Found' };

  let title = seoBook?.seoTitle;
  let description = seoBook?.description;

  title = title || `Download ${archiveDetails?.title || 'Book'} PDF - Read Online - Huda Library`;

  const authorName = archiveDetails?.author;
  const hasAuthor = !isAuthorUnknown(authorName);

  description = description || (hasAuthor
    ? `Read and download ${archiveDetails?.title || 'Book'} by ${authorName || 'Unknown'} in PDF format for free.`
    : `Read and download ${archiveDetails?.title || 'Book'} in PDF format for free online.`);

  const siteUrl = getSiteUrl();

  return {
    title: title || 'Book Details',
    description: (description || '').substring(0, 160),
    alternates: {
      canonical: `${siteUrl}/en/book/${seoBook?.slug || params.slug}`,
      languages: {
        'ar': `${siteUrl}/book/${seoBook?.slug || params.slug}`,
        'en': `${siteUrl}/en/book/${seoBook?.slug || params.slug}`,
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

  // 1. Try to find by slug first (New Style)
  let seoBook = null;
  try {
    seoBook = await getBookBySlug(params.slug, lang);
  } catch (e) {
    console.error('Error in EnglishBookPage getBookBySlug:', e);
  }

  // 2. If not found, check if it's an old-style slug with archiveId
  if (!seoBook && isOldStyleSlug(params.slug)) {
    const archiveId = extractArchiveIdFromSlug(params.slug);
    if (archiveId) {
      try {
        seoBook = await getBookByArchiveId(archiveId, lang);
      } catch (e) {
        console.error('Error in EnglishBookPage getBookByArchiveId:', e);
      }

      // Perform redirect outside try-catch to avoid catching Next.js redirect errors
      if (seoBook && seoBook.slug !== params.slug) {
        permanentRedirect(`/en/book/${seoBook.slug}`);
      }
    }
  }

  let archiveId = seoBook?.archiveId || '';
  if (!archiveId && isOldStyleSlug(params.slug)) {
    archiveId = extractArchiveIdFromSlug(params.slug) || '';
  }

  let archiveBook = null;
  if (archiveId) {
    try {
      archiveBook = await getBookDetails(archiveId);
    } catch (e) {
      console.error('Error in EnglishBookPage getBookDetails:', e);
    }
  }

  if (!archiveBook && !seoBook) {
    console.error(`Book not found (EN): slug=${params.slug}, archiveId=${archiveId}`);
    notFound();
  }

  const displayTitle = seoBook?.title || archiveBook?.title || 'Untitled';
  const displayAuthor = seoBook?.author || archiveBook?.author || 'Unknown';
  const hasAuthor = !isAuthorUnknown(displayAuthor);
  const authorSlug = generateEnglishSlug(displayAuthor);
  const displayCategory = seoBook?.category || 'General';
  const categorySlug = seoBook?.category_slug || generateEnglishSlug(displayCategory);

  let displayDescription = seoBook?.description
    ? cleanDescription(seoBook.description)
    : (hasAuthor
        ? `The book ${displayTitle} is one of the valuable and important works in its field. Author ${displayAuthor} provides a distinguished scientific and methodological vision. This book aims to facilitate access to accurate information for students of knowledge and researchers. You can now download a high-quality PDF version or read directly through your browser through our comprehensive electronic library.`
        : `The book ${displayTitle} is one of the valuable and important works in its field. It provides a distinguished scientific and methodological vision. This book aims to facilitate access to accurate information for students of knowledge and researchers. You can now download a high-quality PDF version or read directly through your browser through our comprehensive electronic library.`);
  let dynamicSeoTitle = seoBook?.seoTitle;

  // Internal Links - Restricted to same category as requested
  let otherBooks: any[] = [];
  try {
    otherBooks = await getBooksByCategory(categorySlug, displayCategory, 12, lang);
    if (archiveId) {
      otherBooks = otherBooks.filter(b => b.archiveId !== archiveId);
    }
  } catch (e) {
    console.error('Error fetching otherBooks (EN):', e);
  }

  let bookFiles: any[] = [];
  if (archiveId) {
    try {
      bookFiles = await getBookFiles(archiveId);
    } catch (e) {
      console.error('Error fetching bookFiles (EN):', e);
    }
  }

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
    { name: displayCategory, item: `${siteUrl}/en/${categorySlug}` },
    { name: displayTitle, item: `${siteUrl}/en/book/${seoBook?.slug || params.slug}` }
  ];

  return (
    <div className="min-h-screen bg-[#fcfcf8] font-tajawal" dir="ltr">
      <BookSchema
        book={{
          title: dynamicSeoTitle || displayTitle,
          author: displayAuthor,
          description: displayDescription || '',
          image: archiveBook?.coverImage,
          url: `${siteUrl}/en/book/${seoBook?.slug || params.slug}`,
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
                        href={`/en/book/${book.slug}`}
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
                </section>
              )}
            </div>

          </div>
        </article>
      </main>
    </div>
  );
}
