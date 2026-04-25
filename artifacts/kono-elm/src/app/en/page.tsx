import { Metadata } from 'next';
import EnglishHomePage from '@/components/home/EnglishHomePage';

export const metadata: Metadata = {
  title: 'Kono Elm Encyclopedia - Comprehensive Islamic Library',
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
