import React from 'react';
import { BookOpen } from 'lucide-react';
import { translations } from '@/lib/translations';
import Link from 'next/link';

interface BookSeoLayerProps {
  ocrSnippet: string | null;
  fallbackText: string;
  lang: 'ar' | 'en';
  archiveId: string;
  slug: string;
}

export default function BookSeoLayer({ ocrSnippet, fallbackText, lang, archiveId, slug }: BookSeoLayerProps) {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  return (
    <section
      className="mt-12 pt-8 border-t border-gray-100"
      aria-label={t.book_preview_title}
    >
      <h2 className={`text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2 ${isRtl ? 'border-r-4 border-gold-500 pr-4' : 'border-l-4 border-gold-500 pl-4'}`}>
        <BookOpen className="w-6 h-6 text-gold-500" />
        {t.book_preview_title}
      </h2>

      <div className="relative group">
        <div
          className="prose prose-lg max-w-none text-gray-600 leading-relaxed overflow-hidden max-h-[400px] relative transition-all duration-300"
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          <div className="whitespace-pre-wrap break-words">
            {ocrSnippet || fallbackText}
          </div>

          {/* Fade Effect Overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        </div>

        <div className="mt-6 flex justify-center">
          <Link
            href={`/reader?id=${archiveId}`}
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary-900 text-white rounded-full font-bold hover:bg-primary-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <BookOpen className="w-5 h-5" />
            {t.read_full_book}
          </Link>
        </div>
      </div>
    </section>
  );
}
