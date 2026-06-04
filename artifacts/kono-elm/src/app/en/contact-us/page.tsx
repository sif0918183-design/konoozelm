import { Metadata } from 'next';
import StaticPageLayout from '@/components/StaticPageLayout';
import { Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us - Huda Library',
  description: 'We welcome all your inquiries, comments, and suggestions. Contact us via Huda Library email.',
};

export default function ContactUs() {
  return (
    <StaticPageLayout title="Contact Us" lang="en">
      <p>We welcome all your inquiries, comments, and suggestions.</p>

      <div className="bg-primary-50 rounded-2xl p-8 flex flex-col items-center text-center gap-4 my-8">
        <div className="w-16 h-16 bg-primary-900 rounded-2xl flex items-center justify-center shadow-lg">
          <Mail className="w-8 h-8 text-gold-200" />
        </div>
        <p className="text-gray-600 font-medium">To contact us, please email us at:</p>
        <a
          href="mailto:info@hudalibrary.com"
          className="text-2xl font-bold text-primary-900 hover:text-gold-700 transition-colors"
        >
          info@hudalibrary.com
        </a>
      </div>

      <p>Messages will be reviewed and responded to as soon as possible.</p>
      <p>Thank you for contacting Huda Library.</p>
    </StaticPageLayout>
  );
}
