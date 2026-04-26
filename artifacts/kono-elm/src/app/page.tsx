import { Metadata } from 'next';
import ArabicHomePage from '@/components/home/ArabicHomePage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://kono-elm.vercel.app',
    languages: {
      'ar': 'https://kono-elm.vercel.app',
      'en': 'https://kono-elm.vercel.app/en',
    },
  },
};

export default function Home() {
  return <ArabicHomePage />;
}
