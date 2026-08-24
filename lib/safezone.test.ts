import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { applyMtdImportRule, assertOnlyApproveCanExplain, createExplanationFromDocument } from './safezone';

const MTD_LOAD_ROUTE = path.join('mtd', 'load', 'route.ts');

function listApiFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listApiFiles(full);
    return full.endsWith('.ts') ? [full] : [];
  });
}

describe('safe-zone invariants', () => {
  it('always creates for_approval explanations from documents', () => {
    const result = createExplanationFromDocument(
      { id: 1, status: 'unexplained', category: null, description: null, documentId: null, attachmentNote: null },
      { documentId: 2, description: 'Taxi receipt', suggestedCategory: 'Travel' },
    );
    expect(result.status).toBe('for_approval');
  });

  it('rejects explained status outside approve route source', () => {
    expect(() => assertOnlyApproveCanExplain('explained', 'other')).toThrowError(
      "Only /api/approve may set status to 'explained'",
    );
    expect(() => assertOnlyApproveCanExplain('explained', 'approve_route')).not.toThrow();
  });

  it('only approve route and the MTD import route write explained status', () => {
    const apiDir = path.join(process.cwd(), 'app', 'api');
    const files = listApiFiles(apiDir);
    const offenders = files.filter((file) => {
      if (file.endsWith(path.join('approve', 'route.ts')) || file.endsWith(MTD_LOAD_ROUTE)) {
        return false;
      }
      const content = fs.readFileSync(file, 'utf8');
      return content.includes("SET status = 'explained'") || content.includes("status: 'explained'");
    });

    expect(offenders).toEqual([]);
  });

  it('MTD import posts explained transactions only via applyMtdImportRule, never a raw literal', () => {
    const routeFile = path.join(process.cwd(), 'app', 'api', MTD_LOAD_ROUTE);
    const content = fs.readFileSync(routeFile, 'utf8');

    expect(content).toContain('applyMtdImportRule');
    expect(content).not.toContain("SET status = 'explained'");
    expect(content).not.toContain("status: 'explained'");

    const result = applyMtdImportRule(
      { id: 1, status: 'unexplained', category: null, description: null, documentId: null, attachmentNote: null },
      { category: 'Travel', description: 'Rail fare' },
    );
    expect(result.status).toBe('explained');
    expect(() => assertOnlyApproveCanExplain('explained', 'mtd_import_rule')).not.toThrow();
  });
});
