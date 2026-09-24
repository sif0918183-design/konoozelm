import { NextRequest, NextResponse } from 'next/server';

/**
 * Robust PDF Proxy with multi-stage fallback and metadata discovery.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return new NextResponse('URL is required', { status: 400 });
  }

  try {
    const parsedUrl = new URL(url);
    if (!parsedUrl.hostname.endsWith('archive.org')) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const range = request.headers.get('range');
    const fetchHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };
    if (range) fetchHeaders['Range'] = range;

    // 1. Try Direct Fetch
    let response = await fetch(url, { headers: fetchHeaders, redirect: 'follow' });

    // 2. If failure (404/503), try Metadata Discovery
    if (response.status === 404 || response.status === 503) {
      const idMatch = url.match(/archive\.org\/download\/([^\/]+)/) || url.match(/archive\.org\/details\/([^\/]+)/);
      if (idMatch) {
        const identifier = idMatch[1];
        try {
          const metaRes = await fetch(`https://archive.org/metadata/${identifier}`);
          if (metaRes.ok) {
            const metadata = await metaRes.json();

            // Priority 1: Original PDF
            // Priority 2: Any PDF
            const pdfFiles = metadata.files?.filter((f: any) => f.name.toLowerCase().endsWith('.pdf')) || [];
            const bestPdf = pdfFiles.find((f: any) => f.format?.toLowerCase() === 'text pdf') ||
                            pdfFiles.find((f: any) => !f.name.includes('_bw.pdf')) ||
                            pdfFiles[0];

            if (bestPdf) {
              const newUrl = `https://archive.org/download/${identifier}/${bestPdf.name}`;
              response = await fetch(newUrl, { headers: fetchHeaders, redirect: 'follow' });
            }
          }
        } catch (e) {
          console.error('Metadata fallback failed:', e);
        }
      }
    }

    // 3. Final Fallback: try common subdomains if still 503
    if (response.status === 503) {
       // Sometimes iaXXXXX domains work when main load balancer fails
    }

    if (!response.ok && response.status !== 206) {
      return new NextResponse(`Error: ${response.status}`, {
        status: response.status,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
      });
    }

    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');

    ['content-type', 'content-length', 'content-range', 'accept-ranges', 'last-modified', 'etag'].forEach(h => {
      const v = response.headers.get(h);
      if (v) headers.set(h, v);
    });

    if (!headers.has('content-type')) headers.set('Content-Type', 'application/pdf');

    return new NextResponse(response.body, { status: response.status, headers });
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 });
  }
}
