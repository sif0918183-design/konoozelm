import { NextRequest, NextResponse } from 'next/server';

/**
 * PDF Proxy with metadata discovery fallback.
 * Resolves CORS and incorrect filename issues (the "20% failure").
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return new NextResponse('URL is required', { status: 400 });
  }

  try {
    let targetUrl = url;

    // Validate hostname
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrl);
    } catch (e) {
      // Handle cases where Next.js might have unencoded spaces
      parsedUrl = new URL(encodeURI(targetUrl));
      targetUrl = parsedUrl.toString();
    }

    if (!parsedUrl.hostname.endsWith('archive.org')) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Common headers for Archive.org
    const fetchHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };

    const range = request.headers.get('range');
    if (range) {
      fetchHeaders['Range'] = range;
    }

    // Try fetching the URL
    let response = await fetch(targetUrl, {
      headers: fetchHeaders,
      redirect: 'follow',
    });

    // Metadata Discovery Fallback:
    // If we get a 404 or 503, try to find the correct PDF filename via Metadata API
    if (response.status === 404 || response.status === 503) {
      const idMatch = targetUrl.match(/archive\.org\/download\/([^\/]+)/);
      if (idMatch) {
        const identifier = idMatch[1];
        console.log(`Fallback: Searching metadata for identifier: ${identifier}`);
        try {
          const metadataRes = await fetch(`https://archive.org/metadata/${identifier}`);
          if (metadataRes.ok) {
            const metadata = await metadataRes.json();
            // Find the first/best PDF file
            const pdfFile = metadata.files?.find((f: any) =>
              f.name.toLowerCase().endsWith('.pdf') &&
              f.format?.toLowerCase().includes('pdf')
            ) || metadata.files?.find((f: any) => f.name.toLowerCase().endsWith('.pdf'));

            if (pdfFile) {
              const newUrl = `https://archive.org/download/${identifier}/${pdfFile.name}`;
              console.log(`Found correct PDF URL: ${newUrl}`);
              response = await fetch(newUrl, {
                headers: fetchHeaders,
                redirect: 'follow',
              });
            }
          }
        } catch (metadataError) {
          console.error('Metadata fallback failed:', metadataError);
        }
      }
    }

    // Final check for response
    if (!response.ok && response.status !== 206) {
      console.error(`Proxy fetch failed for ${targetUrl}: ${response.status} ${response.statusText}`);
      return new NextResponse(`Error from Archive.org: ${response.status}`, { status: response.status });
    }

    // Prepare response headers
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable'); // Cache aggressively

    const headersToForward = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'last-modified',
      'etag'
    ];

    headersToForward.forEach(header => {
      const val = response.headers.get(header);
      if (val) headers.set(header, val);
    });

    if (!headers.has('content-type')) {
      headers.set('Content-Type', 'application/pdf');
    }

    return new NextResponse(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    console.error('PDF Proxy Critical Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
