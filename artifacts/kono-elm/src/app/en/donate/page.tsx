import { Metadata } from 'next';
import StaticPageLayout from '@/components/StaticPageLayout';
import DonateContent from '@/components/DonateContent';

export const metadata: Metadata = {
  title: 'Support Huda Library | Donate',
  description: 'Your contribution enables us to provide thousands of Islamic books & manuscripts for free to researchers worldwide.',
  openGraph: {
    title: 'Support Huda Library | Donate',
    description: 'Your contribution enables us to provide thousands of Islamic books & manuscripts for free to researchers worldwide.',
    type: 'website',
  },
};

export default function EnglishDonatePage() {
  return (
    <StaticPageLayout title="Support Huda Library" lang="en">
      <DonateContent lang="en" />
    </StaticPageLayout>
  );
}
