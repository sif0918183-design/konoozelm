import { Metadata } from 'next';
import StaticPageLayout from '@/components/StaticPageLayout';
import { Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'اتصل بنا - مكتبة هدى',
  description: 'نرحب بجميع استفساراتكم وملاحظاتكم واقتراحاتكم. تواصل معنا عبر البريد الإلكتروني لمكتبة هدى.',
};

export default function ContactUs() {
  return (
    <StaticPageLayout title="اتصل بنا" lang="ar">
      <p>نرحب بجميع استفساراتكم وملاحظاتكم واقتراحاتكم.</p>

      <div className="bg-primary-50 rounded-2xl p-8 flex flex-col items-center text-center gap-4 my-8">
        <div className="w-16 h-16 bg-primary-900 rounded-2xl flex items-center justify-center shadow-lg">
          <Mail className="w-8 h-8 text-gold-200" />
        </div>
        <p className="text-gray-600 font-medium">للتواصل معنا يرجى مراسلتنا عبر البريد الإلكتروني:</p>
        <a
          href="mailto:info@hudalibrary.com"
          className="text-2xl font-bold text-primary-900 hover:text-gold-700 transition-colors"
        >
          info@hudalibrary.com
        </a>
      </div>

      <p>سيتم مراجعة الرسائل والرد عليها في أقرب وقت ممكن.</p>
      <p>شكراً لتواصلكم مع مكتبة هدى.</p>
    </StaticPageLayout>
  );
}
