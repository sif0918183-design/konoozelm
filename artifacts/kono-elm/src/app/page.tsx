import { Metadata } from 'next';
import ArabicHomePage from '@/components/home/ArabicHomePage';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'مكتبة الهدى - موسوعة الكتب الإسلامية الشاملة',
  description: 'موسوعة شاملة للكتب الإسلامية، تتيح لك قراءة وتحميل آلاف الكتب بصيغة PDF مجاناً بروابط مباشرة من Archive.org.',
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
