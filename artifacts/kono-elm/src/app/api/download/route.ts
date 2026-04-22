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

    const response = await fetch(decodedUrl);

    if (!response.ok) {
      return new NextResponse(`Failed to fetch file from Archive.org: ${response.statusText}`, { status: response.status });
    }

    // Use readable stream for efficiency with large PDF files
    const fileStream = response.body;

    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');

    // Forward relevant headers from Archive.org
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }

    const acceptRanges = response.headers.get('accept-ranges');
    if (acceptRanges) {
      headers.set('Accept-Ranges', acceptRanges);
    }
    // Force download with the provided filename, supporting UTF-8 (Arabic characters)
    const encodedFilename = encodeURIComponent(filename);
    headers.set('Content-Disposition', `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`);

    return new NextResponse(fileStream, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Download Proxy Error:', error);
    return new NextResponse(`Error downloading file: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 });
  }
}
