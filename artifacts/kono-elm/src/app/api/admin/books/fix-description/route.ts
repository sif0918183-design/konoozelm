import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { checkAuth } from '@/lib/admin-auth';
import { getBookByArchiveId, saveSeoBook } from '@/lib/seo-data';
import { generateBookDescription } from '@/lib/openai';

export async function POST(request: Request) {
  if (!checkAuth()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { archiveId, lang = 'ar' } = await request.json();

    if (!archiveId) {
      return NextResponse.json({ error: 'Archive ID is required' }, { status: 400 });
    }

    const book = await getBookByArchiveId(archiveId, lang);
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Use AI to regenerate content with the new "no-unknown-author" rules
    const aiContent = await generateBookDescription(book.title, book.author, lang);

    const updatedBook = {
      ...book,
      description: aiContent.description,
      seoTitle: aiContent.seoTitle
    };

    await saveSeoBook(updatedBook);

    // Revalidate paths
    if (updatedBook.category_slug) {
      revalidatePath(`/${updatedBook.category_slug}`);
      revalidatePath(`/en/${updatedBook.category_slug}`);
    }
    if (updatedBook.slug) {
      revalidatePath(`/book/${updatedBook.slug}`);
      revalidatePath(`/en/book/${updatedBook.slug}`);
    }

    return NextResponse.json({ success: true, description: aiContent.description });

  } catch (error: any) {
    console.error('Error in fix-description API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
