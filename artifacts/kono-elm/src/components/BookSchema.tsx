import React from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

interface BookSchemaProps {
  book: {
    title: string;
    author: string;
    description: string;
    image?: string;
    url: string;
    category: string;
    categoryUrl: string;
    datePublished?: string;
  };
  breadcrumbs: {
    name: string;
    item: string;
  }[];
  faq: FAQItem[];
  lang?: 'ar' | 'en';
}

export default function BookSchema({ book, breadcrumbs, faq, lang = 'ar' }: BookSchemaProps) {
  const bookSchema = {
    "@context": "https://schema.org",
    "@type": "Book",
    "name": book.title,
    "author": {
      "@type": "Person",
      "name": book.author
    },
    "description": book.description,
    "image": book.image,
    "url": book.url,
    "genre": book.category,
    "inLanguage": lang,
    "bookFormat": "https://schema.org/EBook",
    "publisher": {
      "@type": "Organization",
      "name": lang === 'ar' ? "مكتبة الهدى" : "Huda Library"
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.item
    }))
  };

  const faqSchema = faq.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faq.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  } : null;

  const webpageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": book.title,
    "description": book.description,
    "publisher": {
      "@type": "Organization",
      "name": lang === 'ar' ? "مكتبة الهدى" : "Huda Library"
    }
  };

  const schemas: any[] = [bookSchema, breadcrumbSchema, webpageSchema];
  if (faqSchema) schemas.push(faqSchema);

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema).replace(/<\/script>/g, '<\\/script>')
          }}
        />
      ))}
    </>
  );
}
