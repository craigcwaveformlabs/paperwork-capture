import { NextResponse } from 'next/server';
import { ensureSeeded } from '@/lib/repo';
import { MTD_CATEGORIES } from '@/lib/mtdCategories';

export async function POST(request: Request) {
  const db = ensureSeeded();
  const formData = await request.formData();
  const requestId = Number(formData.get('requestId'));

  const req = db
    .prepare(
      `SELECT r.id, c.portalToken FROM paperwork_requests r
       JOIN clients c ON c.id = r.clientId
       WHERE r.id = ? AND r.kind = 'mtd_quarterly'`,
    )
    .get(requestId) as { id: number; portalToken: string | null } | undefined;

  if (!req) {
    return NextResponse.json({ error: 'MTD request not found' }, { status: 404 });
  }

  db.prepare('DELETE FROM mtd_figures WHERE requestId = ?').run(req.id);

  const insert = db.prepare('INSERT INTO mtd_figures (requestId, categoryKey, amount) VALUES (?, ?, ?)');
  for (const category of MTD_CATEGORIES) {
    const raw = formData.get(category.key);
    const amount = raw ? Number(raw) : 0;
    if (amount) {
      insert.run(req.id, category.key, amount);
    }
  }

  return NextResponse.redirect(new URL(`/portal/${req.portalToken ?? ''}/mtd/${req.id}`, request.url), 303);
}
