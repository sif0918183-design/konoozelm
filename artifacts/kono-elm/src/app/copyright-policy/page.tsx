import { Metadata } from 'next';
import StaticPageLayout from '@/components/StaticPageLayout';

export const metadata: Metadata = {
  title: 'سياسة حقوق النشر (DMCA) - مكتبة هدى',
  description: 'تحترم مكتبة هدى حقوق الملكية الفكرية وتلتزم بالتعامل مع طلبات إزالة المحتوى المخالف وفقاً لسياسة DMCA.',
};

export default function CopyrightPolicy() {
  return (
    <StaticPageLayout title="سياسة حقوق النشر (DMCA)" lang="ar">
      <p>تحترم مكتبة هدى حقوق الملكية الفكرية وحقوق النشر الخاصة بالمؤلفين والناشرين وأصحاب الحقوق.</p>

      <p className="mt-4">إذا كنت مالكاً لحقوق نشر وتعتقد أن أي محتوى موجود على الموقع ينتهك حقوقك القانونية، يمكنك إرسال طلب إزالة يتضمن:</p>

      <ul className="list-disc list-inside space-y-2 mt-4">
        <li>اسم صاحب الحقوق.</li>
        <li>وصف المحتوى محل الاعتراض.</li>
        <li>رابط الصفحة أو المحتوى المطلوب مراجعته.</li>
        <li>بيانات التواصل الخاصة بك.</li>
        <li>ما يثبت ملكيتك للحقوق أو تمثيلك القانوني لصاحب الحقوق.</li>
      </ul>

      <p className="mt-8">بعد استلام الطلب ومراجعته، سيتم اتخاذ الإجراء المناسب خلال فترة زمنية معقولة، والتي قد تشمل إزالة المحتوى أو تقييد الوصول إليه إذا ثبتت صحة المطالبة.</p>

      <div className="bg-primary-50 rounded-2xl p-6 mt-8">
        <h2 className="text-lg font-bold text-primary-900 mb-2">لتقديم طلبات حقوق النشر أو الاستفسارات القانونية:</h2>
        <a
          href="mailto:info@hudalibrary.com"
          className="text-xl font-bold text-primary-900 hover:text-gold-700 transition-colors"
        >
          info@hudalibrary.com
        </a>
      </div>
    </StaticPageLayout>
  );
}
