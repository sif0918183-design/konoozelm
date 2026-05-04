import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get('lang') || 'ar';

  const manifest = {
    name: lang === 'en' ? "The Ultimate Islamic Library" : "موسوعة المكتبات الإسلامية",
    short_name: lang === 'en' ? "Islamic Library" : "الموسوعة الإسلامية",
    description: lang === 'en'
      ? "Comprehensive Electronic Library for Islamic Books - Read Online & Download"
      : "موسوعة شاملة للكتب الإسلامية - قراءة مباشرة وتحميل",
    start_url: lang === 'en' ? "/en" : "/",
    display: "standalone" as const,
    background_color: "#fcfcf8",
    theme_color: "#154734",
    lang: lang === 'en' ? "en" : "ar",
    dir: lang === 'en' ? "ltr" : "rtl" as const,
    icons: [
      {
        src: "/icon.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icon.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
