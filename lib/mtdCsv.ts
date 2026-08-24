import type { StatementLineItem } from './types';

/**
 * Deterministic parser for the fixed "MTD Upload" CSV format:
 * header row `date,description,amount[,category]`, one transaction per line.
 * No AI involved — this is the client's own maintained export, not a scan.
 */
export function parseMtdCsv(text: string): StatementLineItem[] {
  const rows = splitCsvRows(text).filter((row) => row.length > 0 && row.some((cell) => cell.trim() !== ''));
  if (!rows.length) {
    return [];
  }

  const header = rows[0].map((cell) => cell.trim().toLowerCase());
  const dateIndex = header.indexOf('date');
  const descriptionIndex = header.indexOf('description');
  const amountIndex = header.indexOf('amount');
  const categoryIndex = header.indexOf('category');

  if (dateIndex === -1 || descriptionIndex === -1 || amountIndex === -1) {
    throw new Error('MTD CSV must have date, description, and amount columns');
  }

  return rows.slice(1).map((row) => ({
    date: row[dateIndex]?.trim() ?? '',
    description: row[descriptionIndex]?.trim() ?? '',
    amount: Number(row[amountIndex]?.replace(/[£,]/g, '').trim() ?? 0),
    rawCategory: categoryIndex !== -1 ? row[categoryIndex]?.trim() : undefined,
  }));
}

function splitCsvRows(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .map((line) => splitCsvLine(line));
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}
