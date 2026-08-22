import Anthropic from '@anthropic-ai/sdk';
import type { Extraction, SuggestedCategory } from './types';

const categories: SuggestedCategory[] = [
  'Travel',
  'Accommodation and Meals',
  'Office Costs',
  'Sundries',
  'Cost of Sales',
  'Motor Expenses',
  'Subsistence',
  'Repairs and Maintenance',
  'Software',
  'Professional Fees',
  'Bank/Finance Charges',
  'Rent',
  'Insurance',
  'Rates',
  'Mobile Phone',
  'Internet & Telephone',
];

const extractionPrompt = `You extract one-document-one-item accounting metadata.
Return valid JSON only, with no markdown and no prose.
Schema keys: documentType, merchant, date, totalAmount, currency, vatAmount, vatRate, description, suggestedCategory, extractionConfidence, notes.
Rules:
- documentType: receipt|invoice|bank statement|other
- date: YYYY-MM-DD
- totalAmount numeric
- suggestedCategory must be one of: ${categories.join(', ')}
- extractionConfidence: high|medium|low
- If this is a bank statement or appears multi-transaction, set documentType to "bank statement" and explain in notes.
- Never omit notes; include ambiguity/illegible notes there.
`;

function stripFence(text: string) {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
}

function parseExtraction(raw: string): Extraction {
  const parsed = JSON.parse(stripFence(raw));
  return {
    documentType: parsed.documentType ?? 'other',
    merchant: parsed.merchant ?? '',
    date: parsed.date ?? '',
    totalAmount: Number(parsed.totalAmount ?? 0),
    currency: parsed.currency ?? 'GBP',
    vatAmount: parsed.vatAmount == null ? null : Number(parsed.vatAmount),
    vatRate: parsed.vatRate == null ? null : String(parsed.vatRate),
    description: parsed.description ?? '',
    suggestedCategory: categories.includes(parsed.suggestedCategory)
      ? parsed.suggestedCategory
      : 'Sundries',
    extractionConfidence: ['high', 'medium', 'low'].includes(parsed.extractionConfidence)
      ? parsed.extractionConfidence
      : 'low',
    notes: parsed.notes ? String(parsed.notes) : 'No extraction notes supplied.',
  };
}

export async function extractDocument(
  fileBuffer: Buffer,
  mimeType: string,
  filename = 'upload',
): Promise<Extraction> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      documentType: 'other',
      merchant: '',
      date: '',
      totalAmount: 0,
      currency: 'GBP',
      vatAmount: null,
      vatRate: null,
      description: '',
      suggestedCategory: 'Sundries',
      extractionConfidence: 'low',
      notes: 'ANTHROPIC_API_KEY missing. Extraction not attempted.',
    };
  }

  const anthropic = new Anthropic({ apiKey });
  const isPdf = mimeType.includes('pdf');
  const base64 = fileBuffer.toString('base64');
  const imageMediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' =
    mimeType === 'image/jpeg' || mimeType === 'image/png' || mimeType === 'image/gif' || mimeType === 'image/webp'
      ? mimeType
      : 'image/png';

  const contentBlock = isPdf
    ? [{
        type: 'document' as const,
        source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: base64 },
      }]
    : [{ type: 'image' as const, source: { type: 'base64' as const, media_type: imageMediaType, data: base64 } }];

  let rawText = '';
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: extractionPrompt,
      messages: [
        {
          role: 'user',
          content: [
            ...contentBlock,
            {
              type: 'text',
              text: `Filename: ${filename}. Extract single-item bookkeeping fields as strict JSON.`,
            },
          ],
        },
      ],
    });

    rawText = response.content
      .filter((entry) => entry.type === 'text')
      .map((entry) => entry.text)
      .join('\n');

    try {
      return parseExtraction(rawText);
    } catch {
      // retry once
    }
  }

  return {
    documentType: 'other',
    merchant: '',
    date: '',
    totalAmount: 0,
    currency: 'GBP',
    vatAmount: null,
    vatRate: null,
    description: '',
    suggestedCategory: 'Sundries',
    extractionConfidence: 'low',
    notes: `Parse failure. Raw model output: ${rawText}`,
  };
}

export { categories as CATEGORY_LIST };
