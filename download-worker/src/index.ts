export interface Env {}

export interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

/**
 * Standalone Cloudflare Download Worker for Huda Library.
 * Securely proxies Archive.org PDF downloads and injects RFC 6266 Content-Disposition headers
 * for UTF-8 Arabic file names while preserving HTTP Range streaming and zero-memory buffering.
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const urlObj = new URL(request.url);

    // Handle CORS OPTIONS preflight request
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Fast healthcheck / ping endpoint for client reachability probe
    if (urlObj.pathname === '/ping') {
      return new Response('pong', {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Only handle GET and HEAD requests for download
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const targetUrlParam = urlObj.searchParams.get('url');
    let customFilename = urlObj.searchParams.get('filename');

    if (!targetUrlParam) {
      return new Response('URL parameter is required', { status: 400 });
    }

    let parsedTargetUrl: URL;
    try {
      parsedTargetUrl = new URL(targetUrlParam);
    } catch {
      return new Response('Invalid URL format', { status: 400 });
    }

    // Strict domain check: allow only archive.org and its official subdomains
    const hostname = parsedTargetUrl.hostname.toLowerCase();
    const isAllowedHost = hostname === 'archive.org' || hostname.endsWith('.archive.org');

    if (!isAllowedHost) {
      return new Response('Forbidden: Target domain is not allowed', { status: 403 });
    }

    // SSRF Protection: Block local and private IP addresses
    if (isPrivateHost(hostname)) {
      return new Response('Forbidden: Private IP ranges are blocked', { status: 403 });
    }

    // Extract default filename from URL path if customFilename is not provided
    if (!customFilename) {
      const pathSegments = parsedTargetUrl.pathname.split('/').filter(Boolean);
      const rawName = pathSegments[pathSegments.length - 1];
      if (rawName) {
        try {
          customFilename = decodeURIComponent(rawName);
        } catch {
          customFilename = rawName;
        }
      } else {
        customFilename = 'book.pdf';
      }
    }

    // Ensure filename ends with .pdf
    if (!customFilename.toLowerCase().endsWith('.pdf')) {
      customFilename += '.pdf';
    }

    // Forward Range header if requested by browser
    const fetchHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };

    const rangeHeader = request.headers.get('range');
    if (rangeHeader) {
      fetchHeaders['Range'] = rangeHeader;
    }

    try {
      // Execute manual redirect handling to ensure redirects stay strictly within allowed domains
      let currentUrl = parsedTargetUrl.toString();
      let redirectCount = 0;
      let upstreamResponse: Response | null = null;

      while (redirectCount < 5) {
        upstreamResponse = await fetch(currentUrl, {
          method: request.method,
          headers: fetchHeaders,
          redirect: 'manual',
        });

        if (upstreamResponse.status >= 300 && upstreamResponse.status < 400) {
          const redirectLocation = upstreamResponse.headers.get('location');
          if (!redirectLocation) break;

          const resolvedRedirect = new URL(redirectLocation, currentUrl);
          const redirectHostname = resolvedRedirect.hostname.toLowerCase();

          // Validate redirect destination
          if (
            redirectHostname !== 'archive.org' &&
            !redirectHostname.endsWith('.archive.org')
          ) {
            return new Response('Forbidden: Redirect to unauthorized host blocked', { status: 403 });
          }

          currentUrl = resolvedRedirect.toString();
          redirectCount++;
        } else {
          break;
        }
      }

      if (!upstreamResponse) {
        return new Response('Failed to connect to upstream server', { status: 502 });
      }

      if (!upstreamResponse.ok && upstreamResponse.status !== 206) {
        return new Response(`Upstream Error: ${upstreamResponse.status}`, {
          status: upstreamResponse.status,
        });
      }

      // Build RFC 6266 compliant Content-Disposition header for Arabic / UTF-8 filenames
      const asciiFilename = 'book.pdf';
      const encodedFilename = encodeURIComponent(customFilename);
      const contentDisposition = `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`;

      const responseHeaders = new Headers();
      responseHeaders.set('Content-Type', upstreamResponse.headers.get('content-type') || 'application/pdf');
      responseHeaders.set('Content-Disposition', contentDisposition);

      // Forward caching and range headers
      ['content-length', 'accept-ranges', 'content-range', 'last-modified', 'etag'].forEach((h) => {
        const val = upstreamResponse!.headers.get(h);
        if (val) responseHeaders.set(h, val);
      });

      responseHeaders.set('Access-Control-Allow-Origin', '*');
      responseHeaders.set('Cache-Control', 'private, no-transform');
      if ((request as any).cf?.colo) {
        responseHeaders.set('x-cf-colo', (request as any).cf.colo);
      }

      // Return pure ReadableStream response without memory buffering
      return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        headers: responseHeaders,
      });
    } catch (error) {
      return new Response('Internal Worker Error', { status: 500 });
    }
  },
};

function isPrivateHost(hostname: string): boolean {
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname.startsWith('10.') ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('169.254.')
  ) {
    return true;
  }

  if (hostname.startsWith('172.')) {
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      const secondOctet = parseInt(parts[1], 10);
      if (secondOctet >= 16 && secondOctet <= 31) {
        return true;
      }
    }
  }

  return false;
}
