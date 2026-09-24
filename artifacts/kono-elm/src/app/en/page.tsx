import { Metadata } from 'next';
import EnglishHomePage from '@/components/home/EnglishHomePage';
import { getSiteUrl } from '@/lib/utils';
import { getCategories, getFeaturedBooks } from '@/lib/seo-data';

export const revalidate = 1800;

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: 'Huda Library - Comprehensive Encyclopedia of Islamic Books',
  description: 'A comprehensive encyclopedia of Islamic books, allowing you to read and download thousands of books in PDF format for free with direct links from Archive.org.',
  alternates: {
    canonical: `${siteUrl}/en`,
    languages: {
      'ar': siteUrl,
      'en': `${siteUrl}/en`,
      'x-default': `${siteUrl}/en`,
    },
  },
};

export default async function Home() {
  const [categories, featuredBooks] = await Promise.all([
    getCategories('en'),
    getFeaturedBooks(12, 'en')
  ]);
  return <EnglishHomePage initialCategories={categories} initialFeaturedBooks={featuredBooks} />;
}
