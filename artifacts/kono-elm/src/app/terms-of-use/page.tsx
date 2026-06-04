import { Metadata } from 'next';
import StaticPageLayout from '@/components/StaticPageLayout';

export const metadata: Metadata = {
  title: 'شروط الاستخدام - مكتبة هدى',
  description: 'باستخدامك لموقع مكتبة هدى فإنك توافق على الالتزام بالشروط والأحكام الخاصة بالموقع.',
};

export default function TermsOfUse() {
  return (
    <StaticPageLayout title="شروط الاستخدام" lang="ar">
      <p className="text-sm text-gray-400">آخر تحديث: يونيو 2026</p>

      <p>باستخدامك لموقع مكتبة هدى فإنك توافق على الالتزام بالشروط والأحكام التالية:</p>

      <ul className="list-disc list-inside space-y-2 mt-4">
        <li>استخدام الموقع للأغراض الشخصية والتعليمية المشروعة فقط.</li>
        <li>عدم محاولة تعطيل الموقع أو اختراقه أو الإضرار بخدماته.</li>
        <li>احترام حقوق الملكية الفكرية الخاصة بالمحتوى وأصحاب الحقوق.</li>
        <li>عدم استخدام الموقع بأي طريقة تخالف القوانين المعمول بها.</li>
      </ul>

      <h2 className="text-xl font-bold text-primary-900 mt-8 mb-4">إخلاء المسؤولية:</h2>
      <p>يتم توفير المحتوى لأغراض تعليمية ومعلوماتية فقط، ولا تقدم مكتبة هدى أي ضمانات تتعلق بدقة أو اكتمال أو استمرارية المحتوى.</p>

      <h2 className="text-xl font-bold text-primary-900 mt-8 mb-4">حدود المسؤولية:</h2>
      <p>لا تتحمل مكتبة هدى أي مسؤولية عن الأضرار المباشرة أو غير المباشرة الناتجة عن استخدام الموقع.</p>

      <p className="mt-8">يجوز تعديل هذه الشروط في أي وقت، ويعتبر استمرار استخدام الموقع موافقة على أي تحديثات جديدة.</p>

      <div className="mt-8 pt-8 border-t border-gray-100">
        <p>للتواصل: info@hudalibrary.com</p>
      </div>
    </StaticPageLayout>
  );
}
