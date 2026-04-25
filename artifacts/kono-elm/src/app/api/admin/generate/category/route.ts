import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/admin-auth';
import { generateCategoryDescription } from '@/lib/openai';

export async function POST(request: Request) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { title } = await request.json();
    if (!title) {
        return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    const description = await generateCategoryDescription(title);
    return NextResponse.json({ description });
  } catch (error: any) {
    console.error('Error in category generation API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
