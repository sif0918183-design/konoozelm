import { Metadata } from 'next';
import StaticPageLayout from '@/components/StaticPageLayout';

export const metadata: Metadata = {
  title: 'Privacy Policy - Huda Library',
  description: 'Huda Library is committed to protecting the privacy of its visitors and the information collected during site use.',
};

export default function PrivacyPolicy() {
  return (
    <StaticPageLayout title="Privacy Policy" lang="en">
      <p className="text-sm text-gray-400">Last updated: June 2026</p>

      <p>Huda Library respects the privacy of its visitors and is committed to protecting the information collected during the use of the site.</p>

      <h2 className="text-xl font-bold text-primary-900 mt-8 mb-4">Information that may be collected:</h2>
      <ul className="list-disc list-inside space-y-2">
        <li>Usage data and statistics.</li>
        <li>Information voluntarily sent by the user via email.</li>
      </ul>

      <h2 className="text-xl font-bold text-primary-900 mt-8 mb-4">How information is used:</h2>
      <ul className="list-disc list-inside space-y-2">
        <li>Improving site performance and user experience.</li>
        <li>Responding to inquiries and requests.</li>
        <li>Enhancing site security and stability.</li>
      </ul>

      <h2 className="text-xl font-bold text-primary-900 mt-8 mb-4">Cookies:</h2>
      <p>The site may use cookies to improve the browsing experience and analyze site usage.</p>

      <h2 className="text-xl font-bold text-primary-900 mt-8 mb-4">External Services:</h2>
      <p>The site may use external services such as analysis tools, advertisements, and technical services, which may collect some data according to their own policies.</p>

      <h2 className="text-xl font-bold text-primary-900 mt-8 mb-4">Data Protection:</h2>
      <p>We take reasonable measures to protect data from unauthorized access, modification, or disclosure.</p>

      <h2 className="text-xl font-bold text-primary-900 mt-8 mb-4">Policy Updates:</h2>
      <p>This policy may be modified at any time, and continued use of the site constitutes acceptance of the new updates.</p>

      <div className="mt-8 pt-8 border-t border-gray-100">
        <p>Contact: info@hudalibrary.com</p>
      </div>
    </StaticPageLayout>
  );
}
