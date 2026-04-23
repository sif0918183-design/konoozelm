import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return new NextResponse('URL is required', { status: 400 });
  }

  try {
    const decodedUrl = decodeURIComponent(url);
    const parsedUrl = new URL(decodedUrl);

    if (!parsedUrl.hostname.endsWith('archive.org')) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const response = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return new NextResponse('Error fetching from Archive.org', { status: response.status });
    }

    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Access-Control-Allow-Origin', '*');

    // Forward relevant headers
    ['content-length', 'accept-ranges'].forEach(header => {
      const val = response.headers.get(header);
      if (val) headers.set(header, val);
    });

    return new NextResponse(response.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('PDF Proxy Error:', error);
    return new NextResponse('Error', { status: 500 });
  }
}
