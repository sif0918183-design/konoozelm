import { Metadata } from 'next';
import EnglishHomePage from '@/components/home/EnglishHomePage';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Huda Library - Comprehensive Encyclopedia of Islamic Books',
  description: 'A comprehensive encyclopedia of Islamic books, allowing you to read and download thousands of books in PDF format for free with direct links from Archive.org.',
  alternates: {
    canonical: 'https://kono-elm.vercel.app/en',
    languages: {
      'ar': 'https://kono-elm.vercel.app',
      'en': 'https://kono-elm.vercel.app/en',
    },
  },
};

export default function Home() {
  return <EnglishHomePage />;
}
