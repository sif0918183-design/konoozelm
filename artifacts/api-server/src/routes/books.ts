import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db, searchLogsTable } from "@workspace/db";
import {
  SearchBooksQueryParams,
  SearchBooksResponse,
  PopularSearchesResponse,
  SearchStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const ARCHIVE_SEARCH_URL = "https://archive.org/advancedsearch.php";

interface ArchiveDoc {
  identifier: string;
  title?: string | string[];
  creator?: string | string[];
  date?: string;
  year?: string;
  description?: string | string[];
  downloads?: number;
}

interface ArchiveSearchResponse {
  response?: {
    numFound?: number;
    docs?: ArchiveDoc[];
  };
}

interface ArchiveFile {
  name: string;
  format?: string;
  source?: string;
}

interface ArchiveMetadataResponse {
  files?: ArchiveFile[];
}

const metadataCache = new Map<string, { ts: number; pdfName: string | null }>();
const METADATA_TTL_MS = 1000 * 60 * 60; // 1 hour

function pickFirst(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function buildIaQuery(userQuery: string): string {
  // Restrict to texts; bias toward Arabic / Islamic content but don't exclude others.
  // The user can search broadly; mediatype:texts is the only hard filter.
  const escaped = userQuery.replace(/"/g, '\\"');
  return `(${escaped}) AND mediatype:texts`;
}

function thumbnailFor(identifier: string): string {
  return `https://archive.org/services/img/${encodeURIComponent(identifier)}`;
}

function readerUrl(identifier: string): string {
  return `https://archive.org/details/${encodeURIComponent(identifier)}`;
}

function fallbackDownloadUrl(identifier: string): string {
  // Best-effort guess: Archive.org commonly provides <identifier>.pdf at the download root.
  return `https://archive.org/download/${encodeURIComponent(identifier)}/${encodeURIComponent(identifier)}.pdf`;
}

async function resolvePdfFilename(identifier: string): Promise<string | null> {
  const cached = metadataCache.get(identifier);
  if (cached && Date.now() - cached.ts < METADATA_TTL_MS) {
    return cached.pdfName;
  }
  try {
    const res = await fetch(
      `https://archive.org/metadata/${encodeURIComponent(identifier)}/files`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) {
      metadataCache.set(identifier, { ts: Date.now(), pdfName: null });
      return null;
    }
    const data = (await res.json()) as ArchiveMetadataResponse;
    const files = data.files ?? [];
    // Prefer original PDF, then any PDF.
    const original = files.find(
      (f) => f.source === "original" && /\.pdf$/i.test(f.name),
    );
    const anyPdf = original ?? files.find((f) => /\.pdf$/i.test(f.name));
    const name = anyPdf ? anyPdf.name : null;
    metadataCache.set(identifier, { ts: Date.now(), pdfName: name });
    return name;
  } catch {
    metadataCache.set(identifier, { ts: Date.now(), pdfName: null });
    return null;
  }
}

async function downloadUrlFor(identifier: string): Promise<string> {
  // Return our proxy endpoint URL instead of direct Archive.org URL
  // This allows proper Content-Length and Content-Disposition headers
  return `/api/books/download?identifier=${encodeURIComponent(identifier)}`;
}

router.get("/books/download", async (req, res) => {
  const identifier = req.query.identifier as string;
  if (!identifier) {
    res.status(400).json({ error: "Missing identifier parameter" });
    return;
  }

  try {
    // Get the PDF filename and URL
    const pdfName = await resolvePdfFilename(identifier);
    const fileName = pdfName || `${identifier}.pdf`;
    const archiveUrl = `https://archive.org/download/${encodeURIComponent(identifier)}/${encodeURIComponent(fileName)}`;

    // Set proper headers for download
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    // Use fetch with proper redirect handling and stream directly
    const archiveRes = await fetch(archiveUrl, {
      redirect: "follow",
    });
    
    if (!archiveRes.ok) {
      res.status(502).json({ error: "Failed to download from Archive.org" });
      return;
    }

    // Get content-length from the response if available
    const contentLength = archiveRes.headers.get("content-length");
    if (contentLength) {
      res.setHeader("Content-Length", contentLength);
    }

    // Stream the response directly to the client using native fetch body
    if (archiveRes.body) {
      archiveRes.body.pipeTo(
        new WritableStream({
          write(chunk) {
            res.write(chunk);
          },
          close() {
            res.end();
          },
          abort(err) {
            req.log.error({ err }, "Stream aborted");
            res.destroy(err);
          },
        })
      );
    } else {
      res.end();
    }
  } catch (err) {
    req.log.error({ err }, "Download proxy error");
    if (!res.headersSent) {
      res.status(502).json({ error: "Download failed" });
    }
  }
});

router.get("/books/search", async (req, res) => {
  const parsed = SearchBooksQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query parameters", details: parsed.error.issues });
    return;
  }
  const { q, page, rows } = parsed.data;
  const safePage = page ?? 1;
  const safeRows = rows ?? 24;

  const iaQuery = buildIaQuery(q);
  const url = new URL(ARCHIVE_SEARCH_URL);
  url.searchParams.set("q", iaQuery);
  url.searchParams.set("output", "json");
  url.searchParams.set("rows", String(safeRows));
  url.searchParams.set("page", String(safePage));
  for (const f of [
    "identifier",
    "title",
    "creator",
    "date",
    "year",
    "description",
    "downloads",
  ]) {
    url.searchParams.append("fl[]", f);
  }
  url.searchParams.append("sort[]", "downloads desc");

  let archiveData: ArchiveSearchResponse;
  try {
    const r = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
    });
    if (!r.ok) {
      req.log.error({ status: r.status }, "Archive.org search failed");
      res.status(502).json({ error: "Upstream search failed" });
      return;
    }
    archiveData = (await r.json()) as ArchiveSearchResponse;
  } catch (err) {
    req.log.error({ err }, "Archive.org fetch error");
    res.status(502).json({ error: "Upstream search failed" });
    return;
  }

  const docs = archiveData.response?.docs ?? [];
  const total = archiveData.response?.numFound ?? 0;

  const books = await Promise.all(
    docs.map(async (d) => {
      const identifier = d.identifier;
      const title = pickFirst(d.title) ?? identifier;
      const creator = pickFirst(d.creator) ?? null;
      const description = pickFirst(d.description) ?? null;
      const year = d.year ?? (d.date ? d.date.slice(0, 4) : null);
      const download = await downloadUrlFor(identifier);
      return {
        identifier,
        title,
        creator,
        year,
        description,
        thumbnail: thumbnailFor(identifier),
        readUrl: readerUrl(identifier),
        downloadUrl: download,
        downloads: typeof d.downloads === "number" ? d.downloads : null,
      };
    }),
  );

  // Log successful search (fire-and-forget)
  if (books.length > 0) {
    db.insert(searchLogsTable)
      .values({ query: q, resultsCount: total })
      .catch((err) => req.log.warn({ err }, "Failed to log search"));
  }

  const payload = SearchBooksResponse.parse({
    query: q,
    page: safePage,
    total,
    books,
  });
  res.json(payload);
});

router.get("/books/popular", async (_req, res) => {
  const rows = await db.execute(sql`
    SELECT query, COUNT(*)::int AS count
    FROM search_logs
    WHERE created_at > NOW() - INTERVAL '30 days'
    GROUP BY query
    ORDER BY count DESC
    LIMIT 8
  `);
  const items = (rows.rows as Array<{ query: string; count: number }>).map((r) => ({
    query: r.query,
    count: Number(r.count),
  }));
  const payload = PopularSearchesResponse.parse(items);
  res.json(payload);
});

router.get("/books/stats", async (_req, res) => {
  const rows = await db.execute(sql`
    SELECT
      COUNT(*)::int AS total_searches,
      COUNT(DISTINCT query)::int AS unique_queries,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours')::int AS last_24h
    FROM search_logs
  `);
  const r = (rows.rows[0] ?? {}) as {
    total_searches?: number;
    unique_queries?: number;
    last_24h?: number;
  };
  const payload = SearchStatsResponse.parse({
    totalSearches: Number(r.total_searches ?? 0),
    uniqueQueries: Number(r.unique_queries ?? 0),
    last24h: Number(r.last_24h ?? 0),
  });
  res.json(payload);
});

export default router;
