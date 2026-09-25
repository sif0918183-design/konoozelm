import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const filename = searchParams.get('filename') || 'book.pdf';

  if (!url) {
    return new NextResponse('URL is required', { status: 400 });
  }

  try {
    const parsedUrl = new URL(url);

    if (
      parsedUrl.hostname !== 'archive.org' &&
      !parsedUrl.hostname.endsWith('.archive.org')
    ) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // 1. Try a lightweight HEAD request to check if the direct URL exists
    try {
      const headRes = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
        redirect: 'follow',
      });

      if (headRes.ok) {
        return NextResponse.redirect(url, 302);
      }
    } catch (e) {
      // Ignore network/HEAD errors and fallback to metadata discovery
    }

    // 2. If guessed URL returns 404/503, resolve actual PDF via Archive.org Metadata API
    const idMatch = url.match(/archive\.org\/download\/([^\/]+)/);
    if (idMatch) {
      const identifier = idMatch[1];
      try {
        const metadataRes = await fetch(`https://archive.org/metadata/${identifier}`);
        if (metadataRes.ok) {
          const metadata = await metadataRes.json();
          const pdfFiles = metadata.files?.filter((f: any) => f.name.toLowerCase().endsWith('.pdf')) || [];
          const bestPdf = pdfFiles.find((f: any) => f.format?.toLowerCase() === 'text pdf') ||
                          pdfFiles.find((f: any) => !f.name.includes('_bw.pdf')) ||
                          pdfFiles[0];

          if (bestPdf) {
            const resolvedUrl = `https://archive.org/download/${identifier}/${encodeURIComponent(bestPdf.name)}`;
            return NextResponse.redirect(resolvedUrl, 302);
          }
        }
      } catch (e) {
        console.error('Metadata fallback error:', e);
      }
    }

    // Fallback: Redirect to original URL if metadata discovery also fails
    return NextResponse.redirect(url, 302);
  } catch (error) {
    console.error('Download Proxy Error:', error);
    return new NextResponse('Error', { status: 500 });
  }
}

function streamResponse(response: Response, filename: string) {
  const headers = new Headers();
  headers.set('Content-Type', response.headers.get('content-type') || 'application/pdf');

  const headersToForward = ['content-length', 'accept-ranges', 'last-modified', 'etag'];
  headersToForward.forEach(header => {
    const val = response.headers.get(header);
    if (val) headers.set(header, val);
  });

  const encodedFilename = encodeURIComponent(filename);
  headers.set('Content-Disposition', `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Cache-Control', 'private, no-transform');

  return new NextResponse(response.body, {
    status: 200,
    headers,
  });
}
