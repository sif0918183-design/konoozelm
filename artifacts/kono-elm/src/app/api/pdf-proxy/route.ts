import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 3600; // Cache for 1 hour at the edge

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const archiveId = searchParams.get('archiveId');
  const timestamp = new Date().toISOString();

  console.log(`[${timestamp}] PDF Proxy Request: archiveId=${archiveId}, url=${url ? 'present' : 'absent'}`);

  if (!url && !archiveId) {
    return new NextResponse('URL or archiveId is required', { status: 400 });
  }

  let targetUrl = '';

  if (archiveId) {
    // Standard Archive.org PDF path
    targetUrl = `https://archive.org/download/${archiveId}/${archiveId}.pdf`;
  } else if (url) {
    try {
      targetUrl = decodeURIComponent(url);
      const parsedUrl = new URL(targetUrl);

      // Support archive.org and its iaXXXXXX subdomains
      const isArchiveDomain = parsedUrl.hostname === 'archive.org' ||
                             parsedUrl.hostname.endsWith('.archive.org');

      if (!isArchiveDomain) {
        console.warn(`[${timestamp}] Forbidden domain: ${parsedUrl.hostname}`);
        return new NextResponse('Forbidden: Only archive.org URLs are allowed', { status: 403 });
      }
    } catch (e) {
      console.error(`[${timestamp}] Invalid URL: ${url}`);
      return new NextResponse('Invalid URL', { status: 400 });
    }
  }

  console.log(`[${timestamp}] Proxying to: ${targetUrl}`);

  try {
    const range = request.headers.get('range');
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };

    if (range) {
      headers['Range'] = range;
      console.log(`[${timestamp}] Range request: ${range}`);
    }

    const response = await fetch(targetUrl, {
      headers,
      redirect: 'follow',
      cache: 'no-store', // We manage caching via response headers
    });

    console.log(`[${timestamp}] Archive.org response: ${response.status} ${response.statusText}`);

    // If we tried by archiveId and got 404, we don't return 404 immediately if the caller might want to retry with URL
    // But since this is a server-side route, we just return what we got.

    if (!response.ok && response.status !== 206) {
      console.error(`[${timestamp}] Archive.org fetch failed: ${response.status} for ${targetUrl}`);
      // Return a response with the same status but allow the client to see it's from the proxy
      return new NextResponse(`Error fetching from Archive.org: ${response.status}`, {
        status: response.status,
        headers: {
          'X-Proxy-Error': 'Archive response not OK',
          'Access-Control-Allow-Origin': '*'
        }
      });
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
  } catch (error: any) {
    console.error(`[${timestamp}] PDF Proxy Critical Error:`, error);
    return new NextResponse(`Internal Server Error: ${error.message}`, {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
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
