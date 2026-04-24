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

  if (error) return undefined;
  return data;
}

export async function getBooksByCategory(categorySlug: string, limit: number = 100): Promise<SeoBook[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('seo_books')
    .select('*')
    .eq('category_slug', categorySlug)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Supabase error (getBooksByCategory):', error);
    return [];
  }

  return data.map(b => ({
    ...b,
    archiveId: b.archive_id,
    seoTitle: b.seo_title
  }));
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
