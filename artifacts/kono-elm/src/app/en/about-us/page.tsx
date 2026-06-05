import { Metadata } from 'next';
import StaticPageLayout from '@/components/StaticPageLayout';

export const metadata: Metadata = {
  title: 'About Us - Huda Library',
  description: 'Learn about Huda Library, a digital platform aimed at facilitating access to knowledge by providing a wide range of Islamic, scientific, cultural, and educational books.',
};

export default function AboutUs() {
  return (
    <StaticPageLayout title="About Us" lang="en">
      <p>
        Welcome to Huda Library, a digital platform aimed at facilitating access to knowledge by providing a wide range of Islamic, scientific, cultural, and educational books.
      </p>
      <p>
        We strive to build an integrated electronic library that helps readers, researchers, and students access sources of knowledge easily and quickly, while providing a comfortable and organized user experience.
      </p>
      <p>
        Huda Library continuously works on developing its content and improving its services to meet the needs of readers and promote a culture of reading and continuous learning.
      </p>
      <p>
        We thank all our visitors and look forward to Huda Library being your preferred destination for knowledge and information.
      </p>
    </StaticPageLayout>
  );
}
