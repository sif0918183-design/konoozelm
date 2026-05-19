import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { checkAuth } from '@/lib/admin-auth';
import { getSeoBooks, saveSeoBook, getBookByArchiveId, deleteSeoBook, getTotalBookCount, getCategoryBookCounts, getBooksByCategory } from '@/lib/seo-data';
import { supabaseAdmin } from '@/lib/supabase';
import { generateCleanSlug, resolveUniqueSlug } from '@/lib/slug-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const archiveId = searchParams.get('archiveId');

  if (archiveId) {
    try {
      const book = await getBookByArchiveId(archiveId);
      return NextResponse.json(book || null);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const lang = searchParams.get('lang') || 'ar';
  const categorySlug = searchParams.get('categorySlug');
  const counts = searchParams.get('counts');

  try {
    if (counts) {
      const [total, catCounts] = await Promise.all([
        getTotalBookCount(lang),
        getCategoryBookCounts(lang)
      ]);
      return NextResponse.json({ total, categoryCounts: catCounts });
    }

    if (categorySlug) {
      const books = await getBooksByCategory(categorySlug, undefined, 500, lang);
      return NextResponse.json(books || []);
    }

    const books = await getSeoBooks(lang);
    return NextResponse.json(books || []);
  } catch (error: any) {
    console.error('Error in GET /api/admin/books:', error);
    return NextResponse.json({ error: error.message || 'حدث خطأ أثناء جلب الكتب' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const archiveId = searchParams.get('archiveId');

  if (!archiveId) return NextResponse.json({ error: 'Archive ID required' }, { status: 400 });

  try {
    // Get book info before deletion for revalidation
    const book = await getBookByArchiveId(archiveId);

    await deleteSeoBook(archiveId);

    // Revalidate paths if book existed
    if (book) {
        if (book.category_slug) {
            revalidatePath(`/${book.category_slug}`);
            revalidatePath(`/en/${book.category_slug}`);
        }
        if (book.slug) {
            revalidatePath(`/book/${book.slug}`);
            revalidatePath(`/en/book/${book.slug}`);
        }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/books:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const book = await request.json();

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase Admin Key missing' }, { status: 500 });
    }

    // Ensure clean slug if not provided or if it's an old style
    if (!book.slug || book.slug.includes('--')) {
        const baseSlug = generateCleanSlug(book.title, book.author);

        // Efficiently check for existing slugs starting with the baseSlug
        const { data: existingBooks } = await supabaseAdmin!
          .from('seo_books')
          .select('slug')
          .eq('lang', book.lang || 'ar')
          .ilike('slug', `${baseSlug}%`)
          .neq('archive_id', book.archiveId);

        const existingSlugs = new Set<string>(existingBooks?.map(b => b.slug) || []);
        book.slug = resolveUniqueSlug(baseSlug, existingSlugs);
    }

    await saveSeoBook(book);

    // On-demand revalidation
    if (book.category_slug) {
      revalidatePath(`/${book.category_slug}`);
      revalidatePath(`/en/${book.category_slug}`);
    }
    if (book.slug) {
      revalidatePath(`/book/${book.slug}`);
      revalidatePath(`/en/book/${book.slug}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in POST /api/admin/books:', error);
    return NextResponse.json({ error: error.message || 'فشل حفظ الكتاب - تأكد من إعداد Supabase' }, { status: 500 });
  }
}
