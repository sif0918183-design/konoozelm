import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/admin-auth';
import { generateBookDescription } from '@/lib/groq';

export async function POST(request: Request) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { title, author } = await request.json();
    const content = await generateBookDescription(title, author);
    return NextResponse.json(content);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
