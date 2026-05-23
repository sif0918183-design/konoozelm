import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface ArchiveFile {
  name: string;
  format: string;
}

interface ArchiveMetadata {
  files: ArchiveFile[];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const archiveId = searchParams.get('archiveId');
  const filename = searchParams.get('filename') || 'book.pdf';

  if (!url && !archiveId) {
    return new NextResponse('URL or archiveId is required', { status: 400 });
  }

  let finalUrl = '';

  // 1. Try to discover URL via Metadata API if archiveId is provided
  if (archiveId) {
    try {
      const metaRes = await fetch(`https://archive.org/metadata/${archiveId}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(8000)
      });

      if (metaRes.ok) {
        const data: ArchiveMetadata = await metaRes.json();
        if (data.files && data.files.length > 0) {
          const pdfFiles = data.files.filter(f => f.name.toLowerCase().endsWith('.pdf'));

          // Selection logic identical to pdf-proxy for consistency
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
      console.error('Metadata discovery failed for download:', e);
    }
  }

  // 2. Fallback to manual URL
  if (!finalUrl && url) {
    finalUrl = decodeURIComponent(url);
  }

  if (!finalUrl) {
    // Final fallback: try to guess if we have archiveId
    if (archiveId) {
      finalUrl = `https://archive.org/download/${archiveId}/${archiveId}.pdf`;
    } else {
      return new NextResponse('Could not resolve download URL', { status: 404 });
    }
  }

  try {
    const parsedUrl = new URL(finalUrl);
    if (!parsedUrl.hostname.endsWith('archive.org')) {
      return new NextResponse('Forbidden: Only archive.org URLs are allowed', { status: 403 });
    }

    const response = await fetch(finalUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Referer': 'https://archive.org/',
      },
      redirect: 'follow'
    });

    if (!response.ok) {
      return new NextResponse(`Failed to fetch file: ${response.statusText}`, { status: response.status });
    }

    const fileStream = response.body;
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');

    const contentLength = response.headers.get('content-length');
    if (contentLength) headers.set('Content-Length', contentLength);

    const acceptRanges = response.headers.get('accept-ranges');
    if (acceptRanges) headers.set('Accept-Ranges', acceptRanges);

    // Force download with the provided filename, supporting UTF-8 (Arabic characters)
    const encodedFilename = encodeURIComponent(filename);
    headers.set('Content-Disposition', `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`);

    // Add CORS headers for the download action
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
