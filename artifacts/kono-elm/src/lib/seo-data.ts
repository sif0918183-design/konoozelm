import { supabase, supabaseAdmin } from './supabase';

export interface SeoBook {
  slug: string;
  title: string;
  author: string;
  description: string;
  category: string;
  category_slug?: string;
  archiveId: string;
  seoTitle?: string;
  parts_count?: number;
  lang?: string;
  is_english_verified?: boolean;
  excerpt_p5?: string;
  excerpt_p9?: string;
  excerpt_status?: 'pending' | 'cleaned' | 'failed' | 'raw';
}

export interface Category {
  slug: string;
  title: string;
  description: string;
  display_order?: number;
  lang?: string;
}

export interface Author {
  slug: string;
  name: string;
  bio: string;
  lang?: string;
}

/**
 * Use supabaseAdmin (Service Role) for all WRITE operations.
 * Use regular supabase (Anon Key) for READ operations.
 */

export async function getSeoBooks(lang: string = 'ar'): Promise<SeoBook[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('seo_books')
    .select('*')
    .eq('lang', lang)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Supabase error (getSeoBooks):', error);
    throw error;
  }
  return data.map(b => ({
    ...b,
    archiveId: b.archive_id,
    seoTitle: b.seo_title
  }));
}

export async function saveSeoBook(book: SeoBook) {
  if (!supabaseAdmin) {
    console.error('❌ Cannot save book: SUPABASE_SERVICE_ROLE_KEY is missing');
    throw new Error('Service Role Key missing - checks Vercel Env Vars');
  }

  const payload = {
    slug: book.slug,
    title: book.title,
    author: book.author,
    description: book.description,
    category: book.category,
    category_slug: book.category_slug,
    archive_id: book.archiveId,
    seo_title: book.seoTitle,
    parts_count: book.parts_count || 1,
    lang: book.lang || 'ar',
    is_english_verified: book.is_english_verified || false,
    excerpt_p5: book.excerpt_p5,
    excerpt_p9: book.excerpt_p9,
    excerpt_status: book.excerpt_status || 'pending'
  };

  const { error } = await supabaseAdmin
    .from('seo_books')
    .upsert(payload, { onConflict: 'archive_id' });

  if (error) {
    console.error('Supabase Save Error (Book):', error);
    throw error;
  }
}

export async function deleteSeoBook(archiveId: string) {
  if (!supabaseAdmin) {
    console.error('❌ Cannot delete book: SUPABASE_SERVICE_ROLE_KEY is missing');
    throw new Error('Service Role Key missing');
  }

  const { error } = await supabaseAdmin
    .from('seo_books')
    .delete()
    .eq('archive_id', archiveId);

  if (error) {
    console.error('Supabase Delete Error (Book):', error);
    throw error;
  }
}

export async function getTotalBookCount(lang: string = 'ar'): Promise<number> {
  if (!supabase) return 0;
  const { count, error } = await supabase
    .from('seo_books')
    .select('*', { count: 'exact', head: true })
    .eq('lang', lang);

  if (error) {
    console.error('Supabase error (getTotalBookCount):', error);
    return 0;
  }
  return count || 0;
}

export async function getCategoryBookCounts(lang: string = 'ar'): Promise<Record<string, number>> {
  if (!supabase) return {};
  const { data, error } = await supabase
    .from('seo_books')
    .select('category_slug')
    .eq('lang', lang);

  if (error) {
    console.error('Supabase error (getCategoryBookCounts):', error);
    return {};
  }

  const counts: Record<string, number> = {};
  data.forEach(book => {
    const slug = book.category_slug || 'عام';
    counts[slug] = (counts[slug] || 0) + 1;
  });
  return counts;
}

export async function getCategories(lang: string = 'ar'): Promise<Category[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('seo_categories')
    .select('*')
    .eq('lang', lang)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase error (getCategories):', error);
    return [];
  }
  return data;
}

export async function saveCategory(category: Category) {
  if (!supabaseAdmin) {
    console.error('❌ Cannot save category: SUPABASE_SERVICE_ROLE_KEY is missing');
    throw new Error('Service Role Key missing - checks Vercel Env Vars');
  }

  const payload = {
    ...category,
    lang: category.lang || 'ar'
  };

  const { error } = await supabaseAdmin
    .from('seo_categories')
    .upsert(payload, { onConflict: 'slug' });

  if (error) {
    console.error('Supabase Save Error (Category):', error);
    throw error;
  }
}

export async function getAuthors(lang: string = 'ar'): Promise<Author[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('seo_authors')
    .select('*')
    .eq('lang', lang)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data;
}

export async function getAuthorBySlug(slug: string, lang: string = 'ar'): Promise<Author | undefined> {
  if (!supabase) return undefined;
  const { data, error } = await supabase
    .from('seo_authors')
    .select('*')
    .eq('slug', slug)
    .eq('lang', lang)
    .maybeSingle();

  if (error) return undefined;
  return data;
}

export async function saveAuthor(author: Author) {
  if (!supabaseAdmin) {
    console.error('❌ Cannot save author: SUPABASE_SERVICE_ROLE_KEY is missing');
    throw new Error('Service Role Key missing - checks Vercel Env Vars');
  }

  const payload = {
    ...author,
    lang: author.lang || 'ar'
  };

  const { error } = await supabaseAdmin
    .from('seo_authors')
    .upsert(payload, { onConflict: 'slug' });

  if (error) {
    console.error('Supabase Save Error (Author):', error);
    throw error;
  }
}

export async function getBookByArchiveId(id: string, lang?: string): Promise<SeoBook | undefined> {
  if (!supabase) return undefined;
  let query = supabase.from('seo_books').select('*').eq('archive_id', id);
  if (lang) query = query.eq('lang', lang);

  const { data, error } = await query.maybeSingle();

  if (error || !data) return undefined;
  return {
    ...data,
    archiveId: data.archive_id,
    seoTitle: data.seo_title
  };
}

export async function getBookBySlug(slug: string, lang?: string): Promise<SeoBook | undefined> {
  if (!supabase) return undefined;
  let query = supabase.from('seo_books').select('*').eq('slug', slug);
  if (lang) query = query.eq('lang', lang);

  const { data, error } = await query.maybeSingle();

  if (error || !data) return undefined;
  return {
    ...data,
    archiveId: data.archive_id,
    seoTitle: data.seo_title
  };
}

export async function getCategoryBySlug(slug: string, lang: string = 'ar'): Promise<Category | undefined> {
  if (!supabase) return undefined;
  const { data, error } = await supabase
    .from('seo_categories')
    .select('*')
    .eq('slug', slug)
    .eq('lang', lang)
    .maybeSingle();

  if (error) {
    console.error('Supabase error (getCategoryBySlug):', error);
    return undefined;
  }
  return data;
}

/**
 * Simplified and direct fetch for books in a category.
 * Prioritizes category_slug for absolute matching as requested.
 */
export async function getBooksByCategory(categorySlug: string, categoryTitle?: string, limit: number = 500, lang: string = 'ar'): Promise<SeoBook[]> {
  if (!supabase) return [];

  console.log(`[getBooksByCategory] Querying: slug=${categorySlug}, lang=${lang}, limit=${limit}`);

  try {
    // Direct query by category_slug and lang
    const { data, error, count } = await supabase
        .from('seo_books')
        .select('*', { count: 'exact' })
        .eq('category_slug', categorySlug)
        .eq('lang', lang)
        .order('created_at', { ascending: true })
        .limit(limit);

    if (error) {
        console.error('[getBooksByCategory] Supabase error:', error);
        return [];
    }

    console.log(`[getBooksByCategory] Results found: ${data?.length} (Total in DB for this query: ${count})`);

    if (data && data.length > 0) {
        return data.map(b => ({
            ...b,
            archiveId: b.archive_id,
            seoTitle: b.seo_title
        }));
    }

    // Secondary fallback: only if slug doesn't match, try matching by title
    if (categoryTitle) {
        console.log(`[getBooksByCategory] No results for slug, trying title match: ${categoryTitle}`);
        const { data: titleData } = await supabase
            .from('seo_books')
            .select('*')
            .eq('category', categoryTitle)
            .eq('lang', lang)
            .order('created_at', { ascending: true })
            .limit(limit);

        if (titleData && titleData.length > 0) {
            console.log(`[getBooksByCategory] Results found by title: ${titleData.length}`);
            return titleData.map(b => ({
                ...b,
                archiveId: b.archive_id,
                seoTitle: b.seo_title
            }));
        }
    }

    return [];
  } catch (err) {
    console.error('[getBooksByCategory] Critical failure:', err);
    return [];
  }
}

export async function getBooksByAuthor(author: string, limit: number = 10, lang: string = 'ar'): Promise<SeoBook[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('seo_books')
    .select('*')
    .eq('author', author)
    .eq('lang', lang)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) return [];
  return data.map(b => ({
    ...b,
    archiveId: b.archive_id,
    seoTitle: b.seo_title
  }));
}
