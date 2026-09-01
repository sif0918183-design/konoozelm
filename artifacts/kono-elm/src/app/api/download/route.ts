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

    if (!parsedUrl.hostname.endsWith('archive.org')) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      // Try metadata discovery if direct link fails
      const idMatch = url.match(/archive\.org\/download\/([^\/]+)/) || url.match(/archive\.org\/details\/([^\/]+)/);
      if (idMatch) {
        const identifier = idMatch[1];
        const metadataRes = await fetch(`https://archive.org/metadata/${identifier}`);
        if (metadataRes.ok) {
          const metadata = await metadataRes.json();
          const pdfFiles = metadata.files?.filter((f: any) =>
            f.name &&
            f.name.toLowerCase().endsWith('.pdf') &&
            !f.name.toLowerCase().endsWith('_text.pdf')
          ) || [];

          const bestPdf = pdfFiles.find((f: any) => f.format?.toLowerCase() === 'text pdf') ||
                          pdfFiles.find((f: any) => !f.name.includes('_bw.pdf')) ||
                          pdfFiles[0];

          if (bestPdf) {
             const newUrl = `https://archive.org/download/${identifier}/${encodeURIComponent(bestPdf.name)}`;
             const newRes = await fetch(newUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                },
                redirect: 'follow'
             });
             if (newRes.ok) {
                return streamResponse(newRes, filename);
             }
          }
        }
      }
      return new NextResponse(`Failed: ${response.status}`, { status: response.status });
    }

    return streamResponse(response, filename);
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

  return new NextResponse(response.body, {
    status: 200,
    headers,
  });
}
