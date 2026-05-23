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
  const archiveId = searchParams.get('archiveId');
  const manualUrl = searchParams.get('url');
  const timestamp = new Date().toISOString();

  console.log(`[${timestamp}] Proxy Request: archiveId=${archiveId}, url=${manualUrl ? 'present' : 'absent'}`);

  if (!archiveId && !manualUrl) {
    return new NextResponse('archiveId or url is required', { status: 400 });
  }

  let finalPdfUrl = '';
  let metadataError = '';

  // 1. Try to discover PDF via Metadata API if archiveId is provided
  if (archiveId) {
    try {
      console.log(`[${timestamp}] Fetching metadata for: ${archiveId}`);
      const metaRes = await fetch(`https://archive.org/metadata/${archiveId}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(8000)
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
            console.log(`[${timestamp}] Discovered: ${bestFile.name}`);
          } else {
            metadataError = 'No PDF files found in metadata';
          }
        } else {
          metadataError = 'Empty file list in metadata';
        }
      } else {
        metadataError = `Metadata API returned ${metaRes.status}`;
      }
    } catch (e: any) {
      metadataError = `Metadata fetch error: ${e.message}`;
      console.error(`[${timestamp}] ${metadataError}`);
    }
  }

  // 2. Fallback to manual URL or guessing
  if (!finalPdfUrl) {
    if (manualUrl) {
      try {
        const decodedUrl = decodeURIComponent(manualUrl);
        const parsedUrl = new URL(decodedUrl);

        // SSRF Protection: Only allow archive.org domains
        const isAllowedDomain = parsedUrl.hostname === 'archive.org' ||
                               parsedUrl.hostname.endsWith('.archive.org');

        if (isAllowedDomain) {
          finalPdfUrl = decodedUrl;
          console.log(`[${timestamp}] Using allowed manual URL: ${finalPdfUrl}`);
        } else {
          return new NextResponse('Forbidden: Only archive.org domains are allowed', { status: 403 });
        }
      } catch (e) {
        return new NextResponse('Invalid manual URL', { status: 400 });
      }
    } else if (archiveId) {
      finalPdfUrl = `https://archive.org/download/${archiveId}/${archiveId}.pdf`;
      console.log(`[${timestamp}] Falling back to guessed URL: ${finalPdfUrl}`);
    }
  }

  if (!finalPdfUrl) {
    return new NextResponse(`Resolution Failed: ${metadataError || 'Unknown error'}`, {
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
      'Accept': 'application/pdf,*/*',
      'Referer': 'https://archive.org/',
      'Origin': 'https://archive.org'
    };

    if (range) forwardHeaders['Range'] = range;
    if (ifRange) forwardHeaders['If-Range'] = ifRange;

    const response = await fetch(finalPdfUrl, {
      headers: forwardHeaders,
      redirect: 'follow',
      cache: 'no-store'
    });

    const contentType = response.headers.get('content-type') || '';
    console.log(`[${timestamp}] Final Response Status: ${response.status}, Type: ${contentType}`);

    if (response.ok || response.status === 206) {
      if (!contentType.toLowerCase().includes('application/pdf') && !finalPdfUrl.toLowerCase().endsWith('.pdf')) {
         return new NextResponse(`Invalid Content-Type: ${contentType}`, {
           status: 502,
           headers: { 'Access-Control-Allow-Origin': '*' }
         });
      }

      const responseHeaders = new Headers();
      responseHeaders.set('Content-Type', 'application/pdf');
      responseHeaders.set('Access-Control-Allow-Origin', '*');
      responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
      responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Range');
      responseHeaders.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
      responseHeaders.set('Cross-Origin-Resource-Policy', 'cross-origin');
      responseHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');

      ['content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified', 'content-disposition'].forEach(h => {
        const v = response.headers.get(h);
        if (v) responseHeaders.set(h, v);
      });

      if (!responseHeaders.has('accept-ranges')) {
        responseHeaders.set('accept-ranges', 'bytes');
      }

      return new NextResponse(response.body, {
        status: response.status,
        headers: responseHeaders,
      });
    }

    return new NextResponse(`Upstream Failed: ${response.status}`, {
      status: response.status === 404 ? 404 : 502,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error: any) {
    console.error(`[${timestamp}] Fetch Error:`, error.message);
    return new NextResponse(`Proxy Error: ${error.message}`, {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
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
