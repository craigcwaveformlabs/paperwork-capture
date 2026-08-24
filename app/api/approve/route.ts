import { NextResponse } from 'next/server';
import { ensureSeeded } from '@/lib/repo';
import { assertOnlyApproveCanExplain } from '@/lib/safezone';

export async function POST(request: Request) {
  const db = ensureSeeded();
  const contentType = request.headers.get('content-type') ?? '';
  let body: {
    transactionIds?: number[];
    corrections?: Array<{
      documentId: number;
      correctedAmount?: boolean;
      correctedDate?: boolean;
      correctedTransaction?: boolean;
      correctedCategory?: boolean;
      cleanAccept?: boolean;
    }>;
  };

  if (contentType.includes('application/json')) {
    body = (await request.json().catch(() => ({}))) as typeof body;
  } else {
    const formData = await request.formData();
    body = {
      transactionIds: formData
        .getAll('transactionIds')
        .map((entry) => Number(entry))
        .filter(Boolean),
    };
  }

  const ids = (body.transactionIds ?? []).filter(Boolean);
  if (!ids.length) {
    return NextResponse.json({ error: 'No transactions supplied' }, { status: 400 });
  }

  const update = db.prepare('UPDATE transactions SET status = ?, approvedAt = ? WHERE id = ?');
  const now = new Date().toISOString();

  for (const id of ids) {
    assertOnlyApproveCanExplain('explained', 'approve_route');
    update.run('explained', now, id);
  }

  if (body.corrections?.length) {
    const insert = db.prepare(
      `INSERT INTO accuracy_events (
        documentId, createdAt, correctedAmount, correctedDate, correctedTransaction, correctedCategory, cleanAccept
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const correction of body.corrections) {
      insert.run(
        correction.documentId,
        now,
        correction.correctedAmount ? 1 : 0,
        correction.correctedDate ? 1 : 0,
        correction.correctedTransaction ? 1 : 0,
        correction.correctedCategory ? 1 : 0,
        correction.cleanAccept ? 1 : 0,
      );
    }
  }

  if (contentType.includes('application/json')) {
    return NextResponse.json({ ok: true, approved: ids.length });
  }
  return NextResponse.redirect(new URL('/banking/1?tab=for_approval', request.url), 303);
}
