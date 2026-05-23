import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const filename = searchParams.get('filename') || 'book.pdf';

  if (!url) {
    return new NextResponse('URL is required', { status: 400 });
  }

  try {
    // Security check: Only allow archive.org domains to prevent SSRF
    const decodedUrl = decodeURIComponent(url);
    const parsedUrl = new URL(decodedUrl);

    if (!parsedUrl.hostname.endsWith('archive.org')) {
      return new NextResponse('Forbidden: Only archive.org URLs are allowed', { status: 403 });
    }

    const response = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://hudalibrary.com/',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return new NextResponse(`Failed to fetch file from Archive.org: ${response.statusText}`, { status: response.status });
    }

    // Use readable stream for efficiency with large PDF files
    const fileStream = response.body;

    const headers = new Headers();
    // Use the content-type from the response if available, fallback to application/pdf
    headers.set('Content-Type', response.headers.get('content-type') || 'application/pdf');

    // Forward relevant headers from Archive.org
    const headersToForward = ['content-length', 'accept-ranges', 'last-modified', 'etag'];
    headersToForward.forEach(header => {
      const val = response.headers.get(header);
      if (val) headers.set(header, val);
    });

    // Force download with the provided filename, supporting UTF-8 (Arabic characters)
    const encodedFilename = encodeURIComponent(filename);
    headers.set('Content-Disposition', `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`);
    headers.set('Access-Control-Allow-Origin', '*');

    return new NextResponse(fileStream, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Download Proxy Error:', error);
    return new NextResponse(`Error downloading file: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 });
  }
}
