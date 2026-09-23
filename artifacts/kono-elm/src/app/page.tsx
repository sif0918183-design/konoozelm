import { Metadata } from 'next';
import ArabicHomePage from '@/components/home/ArabicHomePage';
import { getSiteUrl } from '@/lib/utils';
import { getCategories, getFeaturedBooks } from '@/lib/seo-data';

export const revalidate = 300;

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: 'مكتبة الهدى - موسوعة الكتب الإسلامية الشاملة',
  description: 'موسوعة شاملة للكتب الإسلامية، تتيح لك قراءة وتحميل آلاف الكتب بصيغة PDF مجاناً بروابط مباشرة من Archive.org.',
  alternates: {
    canonical: siteUrl,
    languages: {
      'ar': siteUrl,
      'en': `${siteUrl}/en`,
      'x-default': siteUrl,
    },
  },
  other: {
    '0e169a7940e76d19058f3b059aff0fdc12c4d5c9': '0e169a7940e76d19058f3b059aff0fdc12c4d5c9',
    '655f93d9179313933ef5423ee5d45c4e8e6f3c2b': '655f93d9179313933ef5423ee5d45c4e8e6f3c2b',
  },
};

export default async function Home() {
  const [categories, featuredBooks] = await Promise.all([
    getCategories('ar'),
    getFeaturedBooks(12, 'ar')
  ]);
  return <ArabicHomePage initialCategories={categories} initialFeaturedBooks={featuredBooks} />;
}
