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
}

export interface Category {
  slug: string;
  title: string;
  description: string;
}

export interface Author {
  slug: string;
  name: string;
  bio: string;
}

/**
 * Use supabaseAdmin (Service Role) for all WRITE operations.
 * Use regular supabase (Anon Key) for READ operations.
 */

export async function getSeoBooks(): Promise<SeoBook[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('seo_books')
    .select('*')
    .order('created_at', { ascending: false });

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
    parts_count: book.parts_count || 1
  };

  const { error } = await supabaseAdmin
    .from('seo_books')
    .upsert(payload, { onConflict: 'archive_id' });

  if (error) {
    console.error('Supabase Save Error (Book):', error);
    throw error;
  }
}

export async function getCategories(): Promise<Category[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('seo_categories')
    .select('*')
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

  const { error } = await supabaseAdmin
    .from('seo_categories')
    .upsert(category, { onConflict: 'slug' });

  if (error) {
    console.error('Supabase Save Error (Category):', error);
    throw error;
  }
}

export async function getAuthors(): Promise<Author[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('seo_authors')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return [];
  return data;
}

export async function getAuthorBySlug(slug: string): Promise<Author | undefined> {
  if (!supabase) return undefined;
  const { data, error } = await supabase
    .from('seo_authors')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) return undefined;
  return data;
}

export async function saveAuthor(author: Author) {
  if (!supabaseAdmin) {
    console.error('❌ Cannot save author: SUPABASE_SERVICE_ROLE_KEY is missing');
    throw new Error('Service Role Key missing - checks Vercel Env Vars');
  }

  const { error } = await supabaseAdmin
    .from('seo_authors')
    .upsert(author, { onConflict: 'slug' });

  if (error) {
    console.error('Supabase Save Error (Author):', error);
    throw error;
  }
}

export async function getBookByArchiveId(id: string): Promise<SeoBook | undefined> {
  if (!supabase) return undefined;
  const { data, error } = await supabase
    .from('seo_books')
    .select('*')
    .eq('archive_id', id)
    .maybeSingle();

  if (error || !data) return undefined;
  return {
    ...data,
    archiveId: data.archive_id,
    seoTitle: data.seo_title
  };
}

export async function getBookBySlug(slug: string): Promise<SeoBook | undefined> {
  if (!supabase) return undefined;
  const { data, error } = await supabase
    .from('seo_books')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) return undefined;
  return {
    ...data,
    archiveId: data.archive_id,
    seoTitle: data.seo_title
  };
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  if (!supabase) return undefined;
  const { data, error } = await supabase
    .from('seo_categories')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    console.error('Supabase error (getCategoryBySlug):', error);
    return undefined;
  }
  return data;
}

/**
 * Robust fetch for books in a category.
 * Performs dual-matching and has an in-memory fallback to ensure visibility.
 */
export async function getBooksByCategory(categorySlug: string, categoryTitle?: string, limit: number = 200): Promise<SeoBook[]> {
  if (!supabase) return [];

  try {
    // Stage 1: Attempt optimized OR query
    let query = supabase.from('seo_books').select('*');

    if (categoryTitle) {
        query = query.or(`category_slug.eq."${categorySlug}",category.eq."${categoryTitle}"`);
    } else {
        query = query.eq('category_slug', categorySlug);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!error && data && data.length > 0) {
        return data.map(b => ({
            ...b,
            archiveId: b.archive_id,
            seoTitle: b.seo_title
        }));
    }

    // Stage 2: Robust Fallback (Fetch all and filter)
    // This is useful if the OR query syntax fails or RLS is partially restrictive
    const { data: allData, error: allErr } = await supabase
        .from('seo_books')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

    if (allErr || !allData) return [];

    return allData
        .filter(b =>
            b.category_slug === categorySlug ||
            b.category === categoryTitle ||
            b.category?.includes(categoryTitle || '')
        )
        .slice(0, limit)
        .map(b => ({
            ...b,
            archiveId: b.archive_id,
            seoTitle: b.seo_title
        }));

  } catch (err) {
    console.error('Radical Failure in getBooksByCategory:', err);
    return [];
  }
}

export async function getBooksByAuthor(author: string, limit: number = 10): Promise<SeoBook[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('seo_books')
    .select('*')
    .eq('author', author)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return data.map(b => ({
    ...b,
    archiveId: b.archive_id,
    seoTitle: b.seo_title
  }));
}
