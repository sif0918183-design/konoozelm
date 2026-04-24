import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateBookDescription } from '@/lib/groq';

function checkAuth() {
  const session = cookies().get('admin_session');
  return session?.value === 'authenticated';
}

export async function POST(request: Request) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, author } = await request.json();
  try {
    const content = await generateBookDescription(title, author);
    return NextResponse.json(content);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
