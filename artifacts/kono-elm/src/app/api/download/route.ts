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
