import { NextResponse } from 'next/server';
import { buildAuthorizeUrl } from '@/lib/freeagent/auth';

export async function GET() {
  return NextResponse.redirect(buildAuthorizeUrl());
}
