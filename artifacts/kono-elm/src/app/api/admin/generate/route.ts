import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/admin-auth';
import { generateBookDescription } from '@/lib/openai';

export async function POST(request: Request) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { title, author, category, lang = 'ar' } = await request.json();
    const content = await generateBookDescription(title, author, lang, category);
    return NextResponse.json(content);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
