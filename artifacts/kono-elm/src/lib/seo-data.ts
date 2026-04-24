import { supabase } from './supabase';

export interface SeoBook {
  slug: string;
  title: string;
  author: string;
  description: string;
  category: string;
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

export async function getSeoBooks(): Promise<SeoBook[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('seo_books')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return [];
  return data.map(b => ({
    ...b,
    archiveId: b.archive_id,
    seoTitle: b.seo_title
  }));
}

export async function saveSeoBook(book: SeoBook) {
  if (!supabase) return;

  const payload = {
    slug: book.slug,
    title: book.title,
    author: book.author,
    description: book.description,
    category: book.category,
    archive_id: book.archiveId,
    seo_title: book.seoTitle,
    parts_count: book.parts_count || 1
  };

  const { error } = await supabase
    .from('seo_books')
    .upsert(payload, { onConflict: 'archive_id' });

  if (error) throw error;
}

export async function getCategories(): Promise<Category[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('seo_categories')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return [];
  return data;
}

export async function saveCategory(category: Category) {
  if (!supabase) return;
  const { error } = await supabase
    .from('seo_categories')
    .upsert(category, { onConflict: 'slug' });

  if (error) throw error;
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
    .single();

  if (error) return undefined;
  return data;
}

export async function saveAuthor(author: Author) {
  if (!supabase) return;
  const { error } = await supabase
    .from('seo_authors')
    .upsert(author, { onConflict: 'slug' });

  if (error) throw error;
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

export async function getBooksByCategory(categoryTitle: string): Promise<SeoBook[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('seo_books')
    .select('*')
    .eq('category', categoryTitle)
    .limit(10);

  if (error) return [];
  return data.map(b => ({
    ...b,
    archiveId: b.archive_id,
    seoTitle: b.seo_title
  }));
}

export async function getBooksByAuthor(author: string): Promise<SeoBook[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('seo_books')
    .select('*')
    .eq('author', author)
    .limit(10);

  if (error) return [];
  return data.map(b => ({
    ...b,
    archiveId: b.archive_id,
    seoTitle: b.seo_title
  }));
}
