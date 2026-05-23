import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 3600; // Cache for 1 hour at the edge

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const archiveId = searchParams.get('archiveId');

  if (!url && !archiveId) {
    return new NextResponse('URL or archiveId is required', { status: 400 });
  }

  let targetUrl = '';

  if (archiveId) {
    // If archiveId is provided, we construct the PDF URL
    // We assume the PDF has the same name as the identifier, which is common in Archive.org
    targetUrl = `https://archive.org/download/${archiveId}/${archiveId}.pdf`;
  } else if (url) {
    try {
      targetUrl = decodeURIComponent(url);
      const parsedUrl = new URL(targetUrl);

      if (!parsedUrl.hostname.endsWith('archive.org')) {
        return new NextResponse('Forbidden: Only archive.org URLs are allowed', { status: 403 });
      }
    } catch (e) {
      return new NextResponse('Invalid URL', { status: 400 });
    }
  }

  try {
    const range = request.headers.get('range');
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };

    if (range) {
      headers['Range'] = range;
    }

    const response = await fetch(targetUrl, {
      headers,
      redirect: 'follow',
    });

    if (!response.ok && response.status !== 206) {
      console.error(`Archive.org fetch failed: ${response.status} ${response.statusText} for ${targetUrl}`);
      return new NextResponse(`Error fetching from Archive.org: ${response.status}`, { status: response.status });
    }

    const responseHeaders = new Headers();

    // Set Content-Type
    responseHeaders.set('Content-Type', 'application/pdf');

    // Enable CORS
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Range');
    responseHeaders.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');

    // Forward critical headers from Archive.org
    const headersToForward = [
      'content-length',
      'content-range',
      'accept-ranges',
      'content-disposition',
      'cache-control',
      'last-modified',
      'etag'
    ];

    headersToForward.forEach(header => {
      const value = response.headers.get(header);
      if (value) {
        responseHeaders.set(header, value);
      }
    });

    // Ensure Accept-Ranges is set for PDF.js to use range requests
    if (!responseHeaders.has('accept-ranges')) {
      responseHeaders.set('accept-ranges', 'bytes');
    }

    // Add aggressive caching for successful responses
    if (response.status === 200 || response.status === 206) {
      responseHeaders.set('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400');
    }

    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('PDF Proxy Critical Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Range',
      'Access-Control-Max-Age': '86400',
    },
  });
}
