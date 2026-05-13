import { NextRequest, NextResponse } from 'next/server';

const MAX_RETRIES = 3;
const INITIAL_BACKOFF = 1000;

async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  try {
    const response = await fetch(url, options);

    if ([503, 504, 429].includes(response.status) && retries > 0) {
      const delay = INITIAL_BACKOFF * (MAX_RETRIES - retries + 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1);
    }

    return response;
  } catch (error) {
    if (retries > 0) {
      const delay = INITIAL_BACKOFF * (MAX_RETRIES - retries + 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

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

    // Pass Range header if present
    const range = request.headers.get('range');
    const fetchOptions: RequestInit = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ...(range ? { 'Range': range } : {}),
      },
      redirect: 'follow',
    };

    const response = await fetchWithRetry(decodedUrl, fetchOptions);

    if (!response.ok && response.status !== 206) {
      return new NextResponse(`Error fetching from Archive.org: ${response.status}`, { status: response.status });
    }

    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Access-Control-Allow-Origin', '*');

    // Forward relevant headers for PDF.js optimization
    [
      'content-length',
      'content-range',
      'accept-ranges',
      'content-encoding',
      'cache-control'
    ].forEach(header => {
      const val = response.headers.get(header);
      if (val) headers.set(header, val);
    });

    // Ensure we tell the browser we support ranges if Archive.org does
    if (!headers.has('accept-ranges')) {
       headers.set('accept-ranges', 'bytes');
    }

    return new NextResponse(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    console.error('PDF Proxy Error:', error);
    return new NextResponse('Error', { status: 500 });
  }
}
