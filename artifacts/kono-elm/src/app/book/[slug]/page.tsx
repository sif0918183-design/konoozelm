import { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Download, User, Tag, ChevronRight, Book as BookIcon, Sparkles, Globe, HelpCircle } from 'lucide-react';
import { getBookByArchiveId, getBooksByCategory, getBooksByAuthor, getAuthorBySlug, getBookBySlug, getBookBySuffix, saveSeoBook, saveCategory } from '@/lib/seo-data';
import { getBookDetails, getBookFiles } from '@/lib/archive-api';

export const revalidate = 600;
import BookCard from '@/components/BookCard';
import { slugify, getSiteUrl, isAuthorUnknown } from '@/lib/utils';
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  let archiveId: string | undefined;

  // 1. Try to find book by exact slug or suffix
  const decodedSlug = decodeURIComponent(params.slug);
  let seoBook = await getBookBySlug(decodedSlug, 'ar');

  if (!seoBook) {
    const suffix = extractSuffix(decodedSlug);
    if (suffix) {
      seoBook = await getBookBySuffix(suffix, 'ar');
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
      const generated = await generateBookDescription(archiveDetails.title, archiveDetails.author || 'غير معروف', 'ar', seoBook?.category, undefined, archiveDetails.description, archiveId);
      title = title || generated.seoTitle;
      description = generated.description;
    } catch (e) {
      title = title || `تحميل كتاب ${archiveDetails.title} PDF وقراءته أونلاين - مكتبة الهدى`;
      description = archiveDetails.description || `قراءة وتحميل كتاب ${archiveDetails.title} للمؤلف ${archiveDetails.author || 'غير معروف'} بصيغة PDF مجاناً.`;
    }
  }

  title = title || `تحميل كتاب ${archiveDetails?.title || 'كتاب'} PDF وقراءته أونلاين - مكتبة الهدى`;

  const authorName = archiveDetails?.author;
  const hasAuthor = !isAuthorUnknown(authorName);

  description = description || (hasAuthor
    ? `قراءة وتحميل كتاب ${archiveDetails?.title} للمؤلف ${authorName} بصيغة PDF مجاناً.`
    : `قراءة وتحميل كتاب ${archiveDetails?.title} بصيغة PDF مجاناً أونلاين.`);

  const siteUrl = getSiteUrl();

  const arIdeal = getShortSlug(title || archiveDetails?.title || '', archiveId, 'ar');
  const enIdeal = getShortSlug(title || archiveDetails?.title || '', archiveId, 'en');

  return {
    title,
    description: description.substring(0, 160),
    alternates: {
      canonical: `${siteUrl}/book/${encodeURIComponent(seoBook?.new_slug || arIdeal)}`,
      languages: {
        'ar': `${siteUrl}/book/${encodeURIComponent(seoBook?.new_slug || arIdeal)}`,
        'en': `${siteUrl}/en/book/${encodeURIComponent(seoBook?.new_slug || enIdeal)}`,
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

  // 3. REDIRECT CHECK & JIT MIGRATION/CREATION
  if (seoBook) {
    const idealSlug = getShortSlug(seoBook.title, seoBook.archiveId, lang);
    const isLegacy = decodedSlug.includes('--') || (seoBook.slug === decodedSlug && seoBook.new_slug && seoBook.new_slug !== decodedSlug);

    // If it's a legacy URL or matches old slug but new exists, migrate and redirect
    if (isLegacy || (decodedSlug !== idealSlug && !isNewDeterministicSlug(decodedSlug))) {
       // JIT Migration: Update new_slug column
       try {
         console.log(`[JIT] Migrating to new_slug: ${decodedSlug} -> ${idealSlug}`);
         await saveSeoBook({
           ...seoBook,
           new_slug: idealSlug,
           suffix: extractSuffix(idealSlug) || undefined
         });
       } catch (e) {
         console.error('JIT Migration failed:', e);
       }
       permanentRedirect(`/book/${encodeURIComponent(idealSlug)}`);
    }
  } else if (decodedSlug.includes('--')) {
    // 4. JIT CREATION: Book found on Archive but not in our DB
    const extractedId = decodedSlug.split('--').pop();
    if (extractedId) {
      const archiveBook = await getBookDetails(extractedId);
      if (archiveBook) {
        const idealSlug = getShortSlug(archiveBook.title, extractedId, lang);

        try {
          console.log(`[JIT-CREATE] Creating new book record for: ${archiveBook.title} (${extractedId})`);

          // Ensure "General" category exists to avoid FK constraint violation
          try {
            await saveCategory({
              title: 'عام',
              slug: 'عام',
              description: 'كتب متنوعة ومواضيع عامة في العلوم الإسلامية والمعرفية.',
              lang: 'ar'
            });
          } catch (catError) {
            console.warn('JIT Category creation (ar) failed or exists:', catError);
          }

          // Generate professional description using Groq AI
          let aiTitle = `تحميل كتاب ${archiveBook.title} PDF وقراءته أونلاين - مكتبة الهدى`;
          let aiDesc = `قراءة وتحميل كتاب ${archiveBook.title} للمؤلف ${archiveBook.author || 'غير معروف'} بصيغة PDF مجاناً.`;

          try {
            const generated = await generateBookDescription(archiveBook.title, archiveBook.author || 'غير معروف', 'ar', 'عام', undefined, archiveBook.description, extractedId);
            aiTitle = generated.seoTitle;
            aiDesc = generated.description;
          } catch (aiError) {
            console.error('AI Generation failed for JIT creation:', aiError);
          }

          await saveSeoBook({
            archiveId: extractedId,
            title: archiveBook.title,
            author: archiveBook.author || 'غير معروف',
            description: aiDesc,
            seoTitle: aiTitle,
            category: 'عام',
            category_slug: 'عام',
            slug: idealSlug,
            new_slug: idealSlug,
            lang: 'ar',
            parts_count: archiveBook.files?.length || 1,
            suffix: extractSuffix(idealSlug) || undefined
          });
        } catch (saveError) {
          console.error('JIT Creation failed:', saveError);
        }
        // Ensure archiveId is set for the rest of the component
        archiveId = extractedId;
      }
    }
  }

  // 4.5. REDIRECT AFTER SUCCESSFUL JIT CREATION
  // We do this outside the try-catch to allow Next.js to handle the redirect exception
  if (archiveId && !seoBook && decodedSlug.includes('--')) {
    const archiveBookData = await getBookDetails(archiveId);
    if (archiveBookData) {
      const idealSlug = getShortSlug(archiveBookData.title, archiveId, lang);
      if (decodedSlug !== idealSlug) {
        permanentRedirect(`/book/${encodeURIComponent(idealSlug)}`);
      }
    }
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
     permanentRedirect(`/book/${encodeURIComponent(idealSlug)}`);
  }
  const displayAuthor = seoBook?.author || archiveBook?.author || 'غير معروف';
  const hasAuthor = !isAuthorUnknown(displayAuthor);
  const authorSlug = slugify(displayAuthor);
  const displayCategory = seoBook?.category || 'عام';
  const categorySlug = seoBook?.category_slug || slugify(displayCategory);

  // Mandatory content logic (Fallback)
  let displayDescription = seoBook?.description;
  let dynamicSeoTitle = seoBook?.seoTitle;

  if (!displayDescription && archiveBook) {
    try {
      const generated = await generateBookDescription(displayTitle, displayAuthor, 'ar', displayCategory, undefined, archiveBook.description, finalArchiveId);
      displayDescription = generated.description;
      dynamicSeoTitle = generated.seoTitle;
    } catch (e) {
      displayDescription = hasAuthor
        ? `يعتبر كتاب ${displayTitle} من الكتب القيمة والمهمة في بابه، حيث يقدم المؤلف ${displayAuthor} رؤية علمية ومنهجية متميزة. يهدف هذا الكتاب إلى تيسير الوصول للمعلومات الدقيقة لطلبة العلم والباحثين. يمكنك الآن تحميل نسخة PDF عالية الجودة أو القراءة مباشرة عبر متصفحك من خلال مكتبتنا الإلكترونية الشاملة.`
        : `يعتبر كتاب ${displayTitle} من الكتب القيمة والمهمة في بابه، حيث يقدم رؤية علمية ومنهجية متميزة. يهدف هذا الكتاب إلى تيسير الوصول للمعلومات الدقيقة لطلبة العلم والباحثين. يمكنك الآن تحميل نسخة PDF عالية الجودة أو القراءة مباشرة عبر متصفحك من خلال مكتبتنا الإلكترونية الشاملة.`;
    }
  }

  // Internal Links - Restricted to same category as requested
  const otherBooks = await getBooksByCategory(categorySlug, displayCategory, 12, 'ar')
    .then(books => books.filter(b => b.archiveId !== finalArchiveId));

  const bookFiles = await getBookFiles(finalArchiveId);

  // Generate FAQ items
  const faqItems = [
    {
      question: `ما هو كتاب ${displayTitle}؟`,
      answer: hasAuthor
        ? `كتاب ${displayTitle} هو من مؤلفات ${displayAuthor} في تصنيف ${displayCategory}. يعتبر من الكتب القيمة التي توفر معرفة عميقة في مجاله.`
        : `كتاب ${displayTitle} هو كتاب قيم في تصنيف ${displayCategory}. يوفر الكتاب معرفة عميقة في مجاله ويسهل الوصول للمعلومات للباحثين.`
    },
    {
      question: `كيف يمكنني تحميل كتاب ${displayTitle} PDF؟`,
      answer: `يمكنك تحميل كتاب ${displayTitle} بصيغة PDF مباشرة من خلال هذه الصفحة عبر الضغط على زر التحميل، كما يمكنك قراءته أونلاين مجاناً.`
    },
    {
      question: `هل قراءة كتاب ${displayTitle} مجانية؟`,
      answer: `نعم، مكتبة الهدى توفر إمكانية قراءة وتحميل كتاب ${displayTitle} وجميع كتبها ومخطوطاتها الإسلامية مجاناً لجميع الباحثين وطلاب العلم.`
    }
  ];

  const siteUrl = getSiteUrl();

  const breadcrumbs = [
    { name: t.home, item: `${siteUrl}/` },
    { name: displayCategory, item: `${siteUrl}/${categorySlug}` },
    { name: displayTitle, item: `${siteUrl}/book/${encodeURIComponent(idealSlug)}` }
  ];

  return (
    <div className="min-h-screen bg-[#fcfcf8] font-tajawal" dir="rtl">
      <BookSchema
        book={{
          title: dynamicSeoTitle || displayTitle,
          author: displayAuthor,
          description: displayDescription || '',
          image: archiveBook?.coverImage,
          url: `${siteUrl}/book/${encodeURIComponent(idealSlug)}`,
          category: displayCategory,
          categoryUrl: `${siteUrl}/${categorySlug}`
        }}
        breadcrumbs={breadcrumbs}
        faq={faqItems}
        lang="ar"
      />
      <header className="bg-primary-900 text-white pt-2 pb-12 px-4 relative overflow-hidden">
        <LanguageSwitcher light />
        <div className="max-w-7xl mx-auto flex flex-col items-center mt-8 md:mt-4">
          <Link href="/" className="w-full hover:opacity-90 transition-opacity">
            <Logo lang="ar" />
          </Link>
        </div>
      </header>

      {/* Breadcrumbs */}
      <nav className="max-w-7xl mx-auto px-4 py-4 mt-12 md:mt-0 flex items-center gap-2 text-sm text-gray-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-primary-900 transition-colors">{t.home}</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href={`/${categorySlug}`} className="hover:text-primary-900 transition-colors">{displayCategory}</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium truncate" aria-current="page">{displayTitle}</span>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <article className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8">

            {/* Right: Book Cover & Quick Info */}
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
                  <Link href={`/author/${authorSlug}`} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gold-50 transition-colors">
                    <User className="w-5 h-5 text-gold-600" />
                    <div>
                      <p className="text-xs text-gray-400">{t.author}</p>
                      <p className="font-bold text-gray-900">{displayAuthor}</p>
                    </div>
                  </Link>
                )}
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

              {/* Sidebar Ad Placement */}
              <AdverticaAd className="mt-6" />
            </aside>

            {/* Left: Description & Actions */}
            <div className="md:col-span-2 space-y-8">
              <section>
                <h1 className="text-3xl md:text-4xl font-amiri font-bold text-primary-900 mb-4 leading-tight">
                  {dynamicSeoTitle || displayTitle}
                </h1>
                <div className="mb-8 max-w-md">
                  {archiveBook && (
                    <BookCard
                      book={archiveBook}
                      initialFiles={bookFiles}
                      initialSeoSlug={seoBook?.slug}
                    />
                  )}
                </div>
              </section>

              <section className="prose prose-lg max-w-none">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 border-r-4 border-gold-500 pr-4">{lang === 'ar' ? 'نبذة عن الكتاب' : 'About the Book'}</h2>
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {displayDescription}
                </div>
              </section>

              {/* FAQ Section */}
              <section className="pt-12 border-t border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <HelpCircle className="w-6 h-6 text-gold-500" />
                  {lang === 'ar' ? 'الأسئلة الشائعة حول الكتاب' : 'Frequently Asked Questions'}
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

              {/* Mid-content Ad Placement */}
              <AdverticaAd className="my-8" />

              {/* Internal Linking: Related Content */}
              {otherBooks.length > 0 && (
                <section className="pt-12 border-t border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-gold-500" />
                    {lang === 'ar' ? 'قد يعجبك أيضاً' : 'You May Also Like'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {otherBooks.map(book => (
                      <Link
                        key={book.archiveId}
                        href={`/book/${encodeURIComponent(getShortSlug(book.title, book.archiveId, lang))}`}
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
      <Footer lang="ar" />
    </div>
  );
}
