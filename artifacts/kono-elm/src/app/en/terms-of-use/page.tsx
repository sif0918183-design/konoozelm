import { Metadata } from 'next';
import StaticPageLayout from '@/components/StaticPageLayout';

export const metadata: Metadata = {
  title: 'Terms of Use - Huda Library',
  description: 'By using the Huda Library website, you agree to abide by the site\'s terms and conditions.',
};

export default function TermsOfUse() {
  return (
    <StaticPageLayout title="Terms of Use" lang="en">
      <p className="text-sm text-gray-400">Last updated: June 2026</p>

      <p>By using the Huda Library website, you agree to abide by the following terms and conditions:</p>

      <ul className="list-disc list-inside space-y-2 mt-4">
        <li>Use the site for legitimate personal and educational purposes only.</li>
        <li>Not to attempt to disrupt the site, hack it, or damage its services.</li>
        <li>Respect the intellectual property rights of the content and the rightsholders.</li>
        <li>Not to use the site in any way that violates applicable laws.</li>
      </ul>

      <h2 className="text-xl font-bold text-primary-900 mt-8 mb-4">Disclaimer:</h2>
      <p>Content is provided for educational and informational purposes only, and Huda Library makes no warranties regarding the accuracy, completeness, or continuity of the content.</p>

      <h2 className="text-xl font-bold text-primary-900 mt-8 mb-4">Limitation of Liability:</h2>
      <p>Huda Library bears no responsibility for direct or indirect damages resulting from the use of the site.</p>

      <p className="mt-8">These terms may be modified at any time, and continued use of the site constitutes agreement to any new updates.</p>

      <div className="mt-8 pt-8 border-t border-gray-100">
        <p>Contact: info@hudalibrary.com</p>
      </div>
    </StaticPageLayout>
  );
}
