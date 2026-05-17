import { Metadata } from 'next';
import ArabicHomePage from '@/components/home/ArabicHomePage';
import { getSiteUrl } from '@/lib/utils';
import { getCategories } from '@/lib/seo-data';

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
    },
  },
};

export default async function Home() {
  const categories = await getCategories('ar');
  return <ArabicHomePage initialCategories={categories} />;
}
