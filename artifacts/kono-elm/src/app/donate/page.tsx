import { Metadata } from 'next';
import StaticPageLayout from '@/components/StaticPageLayout';
import DonateContent from '@/components/DonateContent';

export const metadata: Metadata = {
  title: 'ادعم مكتبة الهدى | التبرع للمكتبة الرقمية',
  description: 'مساهمتك تمكننا من إتاحة آلاف الكتب والمخطوطات الإسلامية مجانًا للباحثين والقراء حول العالم.',
  openGraph: {
    title: 'ادعم مكتبة الهدى | التبرع للمكتبة الرقمية',
    description: 'مساهمتك تمكننا من إتاحة آلاف الكتب والمخطوطات الإسلامية مجانًا للباحثين والقراء حول العالم.',
    type: 'website',
  },
};

export default function DonatePage() {
  return (
    <StaticPageLayout title="ادعم مكتبة الهدى" lang="ar">
      <DonateContent lang="ar" />
    </StaticPageLayout>
  );
}
