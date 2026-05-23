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
  const url = searchParams.get('url');
  const archiveId = searchParams.get('archiveId');
  const filename = searchParams.get('filename') || 'book.pdf';

  const FETCH_TIMEOUT = 9000; // slightly longer for download

  if (!url && !archiveId) {
    return new NextResponse('URL or archiveId is required', { status: 400 });
  }

  let finalUrl = '';

  // 1. Discovery
  if (archiveId) {
    try {
      const metaRes = await fetch(`https://archive.org/metadata/${archiveId}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(6000)
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
            finalUrl = `https://archive.org/download/${archiveId}/${encodeURIComponent(bestFile.name)}`;
          }
        }
      }
    } catch (e) {
      console.error('Download discovery error:', e);
    }
  }

  // 2. Fallback
  if (!finalUrl && url) {
    finalUrl = decodeURIComponent(url);
  }

  if (!finalUrl) {
    if (archiveId) {
      finalUrl = `https://archive.org/download/${archiveId}/${archiveId}.pdf`;
    } else {
      return new NextResponse('Could not resolve download URL', { status: 404 });
    }
  }

  try {
    const parsedUrl = new URL(finalUrl);
    if (!parsedUrl.hostname.includes('archive.org')) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const response = await fetch(finalUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Referer': 'https://archive.org/',
      },
      redirect: 'follow',
      cache: 'no-store',
      // No timeout here because it's a stream download and can take time,
      // but the initial connection might still be subject to Vercel limits.
    });

    if (!response.ok) {
      return new NextResponse(`Upstream failed: ${response.status}`, { status: response.status === 404 ? 404 : 502 });
    }

    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');

    const contentLength = response.headers.get('content-length');
    if (contentLength) headers.set('Content-Length', contentLength);

    const safeFilename = filename.replace(/["\\]/g, '');
    const encodedFilename = encodeURIComponent(safeFilename);
    headers.set('Content-Disposition', `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`);
    headers.set('Access-Control-Allow-Origin', '*');

    return new NextResponse(response.body, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    return new NextResponse(`Download Error: ${error.message}`, { status: 500 });
  }
}
