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
    parts_count: book.parts_count || 1,
    lang: book.lang || 'ar'
  };

  const { error } = await supabaseAdmin
    .from('seo_books')
    .upsert(payload, { onConflict: 'archive_id' });

  if (error) {
    console.error('Supabase Save Error (Book):', error);
    throw error;
  }
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
 * Robust fetch for books in a category.
 * Performs multiple matching strategies and merges results for absolute reliability.
 */
export async function getBooksByCategory(categorySlug: string, categoryTitle?: string, limit: number = 200, lang: string = 'ar'): Promise<SeoBook[]> {
  if (!supabase) return [];

  try {
    // Stage 1: Try multiple fetch strategies in parallel for speed and coverage
    const [bySlug, byTitle] = await Promise.all([
        supabase.from('seo_books').select('*').eq('category_slug', categorySlug).eq('lang', lang).limit(limit),
        categoryTitle ? supabase.from('seo_books').select('*').eq('category', categoryTitle).eq('lang', lang).limit(limit) : Promise.resolve({data: []})
    ]);

    // Merge results and deduplicate by archiveId
    const merged = [...(bySlug.data || []), ...(byTitle.data || [])];
    const uniqueMap = new Map();

    for (const book of merged) {
        uniqueMap.set(book.archive_id, book);
    }

    if (uniqueMap.size > 0) {
        return Array.from(uniqueMap.values())
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, limit)
            .map(b => ({
                ...b,
                archiveId: b.archive_id,
                seoTitle: b.seo_title
            }));
    }

    // Stage 2: Robust Fallback (Broad fetch and in-memory filter)
    const { data: allData, error: allErr } = await supabase
        .from('seo_books')
        .select('*')
        .eq('lang', lang)
        .order('created_at', { ascending: false })
        .limit(1000);

    if (allErr || !allData) return [];

    return allData
        .filter(b =>
            (b.lang === lang) && (
              b.category_slug === categorySlug ||
              (categoryTitle && b.category === categoryTitle) ||
              (categoryTitle && b.category?.includes(categoryTitle))
            )
        )
        .slice(0, limit)
        .map(b => ({
            ...b,
            archiveId: b.archive_id,
            seoTitle: b.seo_title
        }));

  } catch (err) {
    console.error('Critical failure in getBooksByCategory:', err);
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
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return data.map(b => ({
    ...b,
    archiveId: b.archive_id,
    seoTitle: b.seo_title
  }));
}
