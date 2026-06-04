import { Metadata } from 'next';
import StaticPageLayout from '@/components/StaticPageLayout';

export const metadata: Metadata = {
  title: 'سياسة الخصوصية - مكتبة هدى',
  description: 'تلتزم مكتبة هدى بحماية خصوصية زوارها والمعلومات التي يتم جمعها أثناء استخدام الموقع.',
};

export default function PrivacyPolicy() {
  return (
    <StaticPageLayout title="سياسة الخصوصية" lang="ar">
      <p className="text-sm text-gray-400">آخر تحديث: يونيو 2026</p>

      <p>تحترم مكتبة هدى خصوصية زوارها وتلتزم بحماية المعلومات التي يتم جمعها أثناء استخدام الموقع.</p>

      <h2 className="text-xl font-bold text-primary-900 mt-8 mb-4">المعلومات التي قد يتم جمعها:</h2>
      <ul className="list-disc list-inside space-y-2">
        <li>بيانات الاستخدام والإحصائيات.</li>
        <li>المعلومات التي يرسلها المستخدم طوعاً عبر البريد الإلكتروني.</li>
      </ul>

      <h2 className="text-xl font-bold text-primary-900 mt-8 mb-4">كيفية استخدام المعلومات:</h2>
      <ul className="list-disc list-inside space-y-2">
        <li>تحسين أداء الموقع وتجربة المستخدم.</li>
        <li>الرد على الاستفسارات والطلبات.</li>
        <li>تعزيز أمن الموقع واستقراره.</li>
      </ul>

      <h2 className="text-xl font-bold text-primary-900 mt-8 mb-4">ملفات تعريف الارتباط (Cookies):</h2>
      <p>قد يستخدم الموقع ملفات تعريف الارتباط لتحسين تجربة التصفح وتحليل استخدام الموقع.</p>

      <h2 className="text-xl font-bold text-primary-900 mt-8 mb-4">الخدمات الخارجية:</h2>
      <p>قد يستخدم الموقع خدمات خارجية مثل أدوات التحليل والإعلانات والخدمات التقنية، والتي قد تجمع بعض البيانات وفق سياساتها الخاصة.</p>

      <h2 className="text-xl font-bold text-primary-900 mt-8 mb-4">حماية البيانات:</h2>
      <p>نتخذ إجراءات معقولة لحماية البيانات من الوصول غير المصرح به أو التعديل أو الإفصاح.</p>

      <h2 className="text-xl font-bold text-primary-900 mt-8 mb-4">تحديثات السياسة:</h2>
      <p>يجوز تعديل هذه السياسة في أي وقت، ويعتبر استمرار استخدام الموقع موافقة على التحديثات الجديدة.</p>

      <div className="mt-8 pt-8 border-t border-gray-100">
        <p>للتواصل: info@hudalibrary.com</p>
      </div>
    </StaticPageLayout>
  );
}
