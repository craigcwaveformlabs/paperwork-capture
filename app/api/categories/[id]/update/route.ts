import { NextResponse } from 'next/server';
import { updateCategory } from '@/lib/freeagent/bridgingCategories';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const form = await request.formData();
  const description = String(form.get('description') ?? '').trim();
  const nominalCode = String(form.get('nominalCode') ?? '').trim();
  const taxReportingName = String(form.get('taxReportingName') ?? '').trim();

  const url = new URL('/categories', request.url);

  try {
    await updateCategory(id, { description, nominalCode, taxReportingName: taxReportingName || undefined });
    url.searchParams.set('msg', `Updated "${description}"`);
  } catch (err) {
    url.searchParams.set('error', (err as Error).message);
  }

  return NextResponse.redirect(url, 303);
}
