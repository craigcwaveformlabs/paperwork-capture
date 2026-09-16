import { NextResponse } from 'next/server';
import { createCategory, type EditableCategoryGroup } from '@/lib/freeagent/bridgingCategories';

export async function POST(request: Request) {
  const form = await request.formData();
  const description = String(form.get('description') ?? '').trim();
  const nominalCode = String(form.get('nominalCode') ?? '').trim();
  const categoryGroup = String(form.get('categoryGroup') ?? '') as EditableCategoryGroup;
  const taxReportingName = String(form.get('taxReportingName') ?? '').trim();

  const url = new URL('/categories', request.url);

  try {
    await createCategory({ description, nominalCode, categoryGroup, taxReportingName: taxReportingName || undefined });
    url.searchParams.set('msg', `Created "${description}"`);
  } catch (err) {
    url.searchParams.set('error', (err as Error).message);
  }

  return NextResponse.redirect(url, 303);
}
