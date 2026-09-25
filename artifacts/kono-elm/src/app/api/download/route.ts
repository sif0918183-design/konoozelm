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

    let targetPdfUrl = url;

    // 1. Try a lightweight HEAD request to check if the direct URL exists
    try {
      const headRes = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
        redirect: 'follow',
      });

      if (!headRes.ok) {
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
                targetPdfUrl = `https://archive.org/download/${identifier}/${encodeURIComponent(bestPdf.name)}`;
              }
            }
          } catch (e) {
            console.error('Metadata fallback error:', e);
          }
        }
      }
    } catch (e) {
      // Ignore network/HEAD errors
    }

    // Redirect to Standalone Cloudflare Download Worker (download.hudalibrary.com)
    // Zero PDF bytes are read or streamed through Vercel
    const workerDownloadUrl = `https://download.hudalibrary.com/download?url=${encodeURIComponent(targetPdfUrl)}&filename=${encodeURIComponent(filename)}`;
    return NextResponse.redirect(workerDownloadUrl, 302);
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
