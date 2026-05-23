import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const archiveId = searchParams.get('archiveId');
  const timestamp = new Date().toISOString();

  if (!url && !archiveId) {
    return new NextResponse('URL or archiveId is required', { status: 400 });
  }

  // Generate candidate URLs
  let candidates: string[] = [];

  if (url) {
    try {
      const decoded = decodeURIComponent(url);
      const parsed = new URL(decoded);
      if (parsed.hostname.endsWith('archive.org')) {
        candidates.push(decoded);
      }
    } catch (e) {}
  }

  if (archiveId) {
    // Standard format
    candidates.push(`https://archive.org/download/${archiveId}/${archiveId}.pdf`);
    // Subdomain format fallback
    candidates.push(`https://ia800000.us.archive.org/items/${archiveId}/${archiveId}.pdf`);
  }

  // Unique candidates only
  candidates = Array.from(new Set(candidates));

  const range = request.headers.get('range');
  const commonHeaders: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept': 'application/pdf,application/octet-stream,*/*',
    'Referer': 'https://archive.org/',
    'Origin': 'https://archive.org'
  };

  if (range) {
    commonHeaders['Range'] = range;
  }

  console.log(`[${timestamp}] Proxying Request: archiveId=${archiveId}, candidates=${candidates.length}`);

  for (const targetUrl of candidates) {
    try {
      console.log(`[${timestamp}] Trying candidate: ${targetUrl}`);
      const response = await fetch(targetUrl, {
        headers: commonHeaders,
        redirect: 'follow',
        cache: 'no-store'
      });

      console.log(`[${timestamp}] Upstream status: ${response.status} for ${targetUrl}`);

      if (response.ok || response.status === 206) {
        const responseHeaders = new Headers();

        // Essential Security & CORS headers
        responseHeaders.set('Content-Type', 'application/pdf');
        responseHeaders.set('Access-Control-Allow-Origin', '*');
        responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
        responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Range');
        responseHeaders.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
        responseHeaders.set('Cross-Origin-Resource-Policy', 'cross-origin');
        responseHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');

        // Forward critical headers
        ['content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified'].forEach(h => {
          const v = response.headers.get(h);
          if (v) responseHeaders.set(h, v);
        });

        if (!responseHeaders.has('accept-ranges')) {
          responseHeaders.set('accept-ranges', 'bytes');
        }

        return new NextResponse(response.body, {
          status: response.status,
          headers: responseHeaders,
        });
      }
    } catch (error: any) {
      console.error(`[${timestamp}] Candidate failed: ${targetUrl} - ${error.message}`);
    }
  }

  // Final failure response with CORS headers
  return new NextResponse('Could not load PDF from Archive.org', {
    status: 502,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'text/plain',
      'X-Proxy-Error': 'All attempts failed'
    }
  });
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
