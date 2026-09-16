import { NextResponse } from 'next/server';
import { deleteCategory } from '@/lib/freeagent/bridgingCategories';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const form = await request.formData();
  const description = String(form.get('description') ?? '');

  const url = new URL('/categories', request.url);

  try {
    await deleteCategory(id);
    url.searchParams.set('msg', `Deleted "${description}"`);
  } catch (err) {
    url.searchParams.set('error', (err as Error).message);
  }

  return NextResponse.redirect(url, 303);
}
