import { NextResponse } from 'next/server';
import { createBridgingCategories } from '@/lib/freeagent/bridgingCategories';

export async function POST(request: Request) {
  const results = await createBridgingCategories();

  const created = results.filter((r) => r.status === 'created').length;
  const skipped = results.filter((r) => r.status === 'skipped').length;
  const failed = results.filter((r) => r.status === 'failed').length;

  const url = new URL('/categories', request.url);
  url.searchParams.set('created', String(created));
  url.searchParams.set('skipped', String(skipped));
  url.searchParams.set('failed', String(failed));
  return NextResponse.redirect(url, 303);
}
