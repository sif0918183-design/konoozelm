import { getSeoBooks, getCategories, getAuthors } from '@/lib/seo-data';
import { getShortSlug } from '@/lib/slug-utils';
import { getSiteUrl } from '@/lib/utils';

export const revalidate = 3600; // Cache sitemap for 1 hour for fast TTFB

export async function GET() {
  const BASE_URL = getSiteUrl();

  const [arBooks, arCategories, arAuthors, enBooks, enCategories, enAuthors] = await Promise.all([
    getSeoBooks('ar'),
    getCategories('ar'),
    getAuthors('ar'),
    getSeoBooks('en'),
    getCategories('en'),
    getAuthors('en')
  ]);

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Arabic Pages -->
  <url>
    <loc>${BASE_URL}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${BASE_URL}/continue-reading</loc>
    <changefreq>daily</changefreq>
    <priority>0.5</priority>
  </url>
  ${arCategories.map(cat => `
  <url>
    <loc>${BASE_URL}/${cat.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
  ${arAuthors.map(author => `
  <url>
    <loc>${BASE_URL}/author/${author.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}
  ${arBooks.map(book => `
  <url>
    <loc>${BASE_URL}/book/${encodeURIComponent(book.new_slug || getShortSlug(book.title, book.archiveId, 'ar'))}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('')}

  <!-- English Pages -->
  <url>
    <loc>${BASE_URL}/en</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${BASE_URL}/en/continue-reading</loc>
    <changefreq>daily</changefreq>
    <priority>0.5</priority>
  </url>
  ${enCategories.map(cat => `
  <url>
    <loc>${BASE_URL}/en/${cat.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
  ${enAuthors.map(author => `
  <url>
    <loc>${BASE_URL}/en/author/${author.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}
  ${enBooks.map(book => `
  <url>
    <loc>${BASE_URL}/en/book/${encodeURIComponent(book.new_slug || getShortSlug(book.title, book.archiveId, 'en'))}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
