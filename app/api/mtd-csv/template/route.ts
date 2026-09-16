import { generateMtdWorkbookTemplate } from '@/lib/freeagent/xlsx';

export async function GET() {
  const buffer = await generateMtdWorkbookTemplate();
  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="mtd-bridging-template.xlsx"',
    },
  });
}
