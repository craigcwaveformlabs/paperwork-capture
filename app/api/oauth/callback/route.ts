import { NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '@/lib/freeagent/auth';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error)}`, request.url));
  }
  if (!code) {
    return NextResponse.redirect(new URL('/?error=missing_code', request.url));
  }

  try {
    await exchangeCodeForTokens(code);
  } catch (err) {
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent((err as Error).message)}`, request.url));
  }

  return NextResponse.redirect(new URL('/', request.url));
}
