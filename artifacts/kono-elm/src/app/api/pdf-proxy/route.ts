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

    // Forward Range header if present for streaming and PDF.js efficiency
    const range = request.headers.get('range');
    const fetchHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://hudalibrary.com/',
    };

    if (range) {
      fetchHeaders['Range'] = range;
    }

    const response = await fetch(decodedUrl, {
      headers: fetchHeaders,
      redirect: 'follow',
    });

    // Support both 200 OK and 206 Partial Content
    if (!response.ok && response.status !== 206) {
      return new NextResponse(`Error fetching from Archive.org: ${response.statusText}`, { status: response.status });
    }

    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');

    // Forward relevant headers for PDF streaming and caching
    const headersToForward = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'cache-control',
      'last-modified',
      'etag'
    ];

    headersToForward.forEach(header => {
      const val = response.headers.get(header);
      if (val) {
        headers.set(header, val);
      }
    });

    // Ensure content type is always set for PDF
    if (!headers.has('content-type')) {
      headers.set('Content-Type', 'application/pdf');
    }

    return new NextResponse(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    console.error('PDF Proxy Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
