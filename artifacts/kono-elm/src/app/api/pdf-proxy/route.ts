import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface ArchiveFile {
  name: string;
  format: string;
}

interface ArchiveMetadata {
  files?: ArchiveFile[];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const archiveId = searchParams.get('archiveId');
  const manualUrl = searchParams.get('url');

  // Use a shorter timeout to stay within Vercel limits (10s for Hobby)
  const FETCH_TIMEOUT = 7000;

  if (!archiveId && !manualUrl) {
    return new NextResponse('archiveId or url is required', { status: 400 });
  }

  let finalPdfUrl = '';
  let metadataError = '';

  // 1. Try to discover PDF via Metadata API
  if (archiveId) {
    try {
      const metaRes = await fetch(`https://archive.org/metadata/${archiveId}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(FETCH_TIMEOUT)
      });

      if (metaRes.ok) {
        const data: ArchiveMetadata = await metaRes.json();
        if (data.files && data.files.length > 0) {
          const pdfFiles = data.files.filter(f => f.name.toLowerCase().endsWith('.pdf'));

          const bestFile =
            pdfFiles.find(f => f.format === 'Text PDF' || f.format === 'Additional PDF') ||
            pdfFiles.find(f => !f.name.toLowerCase().includes('_text') && !f.name.toLowerCase().includes('_bw')) ||
            pdfFiles[0];

          if (bestFile) {
            finalPdfUrl = `https://archive.org/download/${archiveId}/${encodeURIComponent(bestFile.name)}`;
          } else {
            metadataError = 'No PDF found in metadata';
          }
        } else {
          metadataError = 'Empty files list';
        }
      } else {
        metadataError = `Metadata status ${metaRes.status}`;
      }
    } catch (e: any) {
      metadataError = `Metadata error: ${e.message}`;
    }
  }

  // 2. Fallback to manual URL or guessing
  if (!finalPdfUrl) {
    if (manualUrl) {
      try {
        const decodedUrl = decodeURIComponent(manualUrl);
        const parsedUrl = new URL(decodedUrl);
        if (parsedUrl.hostname.includes('archive.org')) {
          finalPdfUrl = decodedUrl;
        } else {
          return new NextResponse('Forbidden domain', { status: 403 });
        }
      } catch (e) {
        return new NextResponse('Invalid URL', { status: 400 });
      }
    } else if (archiveId) {
      finalPdfUrl = `https://archive.org/download/${archiveId}/${archiveId}.pdf`;
    }
  }

  if (!finalPdfUrl) {
    return new NextResponse(`Resolution Failed: ${metadataError || 'Unknown'}`, {
      status: 404,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }

  // 3. Proxy the PDF
  try {
    const range = request.headers.get('range');
    const ifRange = request.headers.get('if-range');

    const forwardHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Referer': 'https://archive.org/',
    };

    if (range) forwardHeaders['Range'] = range;
    if (ifRange) forwardHeaders['If-Range'] = ifRange;

    const response = await fetch(finalPdfUrl, {
      headers: forwardHeaders,
      redirect: 'follow',
      cache: 'no-store',
      signal: AbortSignal.timeout(FETCH_TIMEOUT)
    });

    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    // More relaxed validation: allow if it's a success status or partial content
    if (response.ok || response.status === 206) {
      const responseHeaders = new Headers();
      responseHeaders.set('Content-Type', 'application/pdf');
      responseHeaders.set('Access-Control-Allow-Origin', '*');
      responseHeaders.set('Cross-Origin-Resource-Policy', 'cross-origin');
      responseHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');

      ['content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified', 'content-disposition'].forEach(h => {
        const v = response.headers.get(h);
        if (v) responseHeaders.set(h, v);
      });

      return new NextResponse(response.body, {
        status: response.status,
        headers: responseHeaders,
      });
    }

    return new NextResponse(`Upstream Error: ${response.status}`, { status: response.status === 404 ? 404 : 502 });

  } catch (error: any) {
    // If it was a timeout, try to return a better error
    if (error.name === 'AbortError') {
      return new NextResponse('Proxy Timeout: Archive.org took too long', { status: 504 });
    }
    return new NextResponse(`Proxy Error: ${error.message}`, { status: 500 });
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
