import { getSeoBooks, getCategories, getAuthors } from '@/lib/seo-data';

const BASE_URL = 'https://kono-elm.vercel.app';

export async function GET() {
  const [books, categories, authors] = await Promise.all([
    getSeoBooks(),
    getCategories(),
    getAuthors()
  ]);

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  ${categories.map(cat => `
  <url>
    <loc>${BASE_URL}/${cat.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
  ${authors.map(author => `
  <url>
    <loc>${BASE_URL}/author/${author.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}
  ${books.map(book => `
  <url>
    <loc>${BASE_URL}/book/${book.slug}--${book.archiveId}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
