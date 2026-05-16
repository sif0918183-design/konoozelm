import React from 'react';

interface BookSchemaProps {
  book: {
    title: string;
    author: string;
    description: string;
    language: string;
    category: string;
    coverImage?: string;
    datePublished?: string;
    publisher?: string;
    identifier: string;
    url: string;
    excerpt?: string;
  };
}

export default function BookSchema({ book }: BookSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Book",
    "name": book.title,
    "author": {
      "@type": "Person",
      "name": book.author
    },
    "description": book.description,
    "inLanguage": book.language,
    "genre": book.category,
    "image": book.coverImage,
    "datePublished": book.datePublished,
    "publisher": book.publisher ? {
      "@type": "Organization",
      "name": book.publisher
    } : undefined,
    "bookFormat": "https://schema.org/EBook",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": book.url
    },
    "identifier": book.identifier,
    "workExample": {
      "@type": "Book",
      "bookFormat": "https://schema.org/EBook",
      "potentialAction": {
        "@type": "ReadAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": book.url,
          "actionPlatform": [
            "http://schema.org/DesktopWebPlatform",
            "http://schema.org/MobileWebPlatform"
          ]
        }
      }
    },
    "excerpt": book.excerpt
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
