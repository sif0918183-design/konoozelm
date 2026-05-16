import React from 'react';
import { BookOpen } from 'lucide-react';
import { translations } from '@/lib/translations';
import Link from 'next/link';

import { List, Hash } from 'lucide-react';

interface BookSeoLayerProps {
  ocrSnippet: string | null;
  toc?: string[];
  relatedTopics?: string[];
  fallbackText: string;
  lang: 'ar' | 'en';
  archiveId: string;
  slug: string;
}

export default function BookSeoLayer({ ocrSnippet, toc, relatedTopics, fallbackText, lang, archiveId, slug }: BookSeoLayerProps) {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  return (
    <div className="space-y-12">
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
            className="prose prose-lg max-w-none text-gray-600 leading-relaxed overflow-hidden max-h-[500px] relative transition-all duration-300"
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            <div className="whitespace-pre-wrap break-words italic bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
              {ocrSnippet ? (
                <>
                  {ocrSnippet}
                  <div className="mt-6 pt-6 border-t border-gray-200 not-italic text-sm text-gray-500">
                    {fallbackText}
                  </div>
                </>
              ) : fallbackText}
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

      {/* Table of Contents (ToC) Block - SEO Powerhouse */}
      {toc && toc.length > 0 && (
        <section className="bg-primary-50/30 p-8 rounded-3xl border border-primary-100/50">
          <h3 className="text-xl font-bold text-primary-900 mb-6 flex items-center gap-2">
            <List className="w-5 h-5 text-gold-600" />
            {isRtl ? 'فهرس المحتويات المستخرج' : 'Extracted Table of Contents'}
          </h3>
          <ul className={`grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 ${isRtl ? 'text-right' : 'text-left'}`}>
            {toc.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 text-gray-700 hover:text-primary-800 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-gold-400 mt-2.5 flex-shrink-0" />
                <span className="font-medium line-clamp-1">{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Related Topics SEO Block */}
      {relatedTopics && relatedTopics.length > 0 && (
        <section className="pt-8 border-t border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Hash className="w-5 h-5 text-gold-500" />
            {isRtl ? 'مواضيع إسلامية ذات صلة' : 'Related Islamic Topics'}
          </h3>
          <div className="flex flex-wrap gap-2">
            {relatedTopics.map((topic, idx) => (
              <span
                key={idx}
                className="px-4 py-1.5 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-600 hover:border-gold-300 hover:text-gold-700 transition-all"
              >
                {topic}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
