import { Metadata } from 'next';
import StaticPageLayout from '@/components/StaticPageLayout';

export const metadata: Metadata = {
  title: 'Copyright Policy (DMCA) - Huda Library',
  description: 'Huda Library respects intellectual property rights and is committed to handling infringement removal requests according to the DMCA policy.',
};

export default function CopyrightPolicy() {
  return (
    <StaticPageLayout title="Copyright Policy (DMCA)" lang="en">
      <p>Huda Library respects the intellectual property and copyrights of authors, publishers, and rightsholders.</p>

      <p className="mt-4">If you are a copyright owner and believe that any content on the site violates your legal rights, you can send a removal request including:</p>

      <ul className="list-disc list-inside space-y-2 mt-4">
        <li>Name of the rightsholder.</li>
        <li>Description of the content in question.</li>
        <li>Link to the page or content to be reviewed.</li>
        <li>Your contact information.</li>
        <li>Proof of ownership of rights or legal representation of the rightsholder.</li>
      </ul>

      <p className="mt-8">After receiving and reviewing the request, appropriate action will be taken within a reasonable period, which may include removing the content or restricting access to it if the claim is proven valid.</p>

      <div className="bg-primary-50 rounded-2xl p-6 mt-8">
        <h2 className="text-lg font-bold text-primary-900 mb-2">To submit copyright requests or legal inquiries:</h2>
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
