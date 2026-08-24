import type { SuggestedCategory } from './types';

export type MtdCategoryKey =
  | 'turnover'
  | 'other_income'
  | 'cost_of_goods'
  | 'cis_payments'
  | 'staff_costs'
  | 'travel_costs'
  | 'premises_costs'
  | 'maintenance_costs'
  | 'admin_costs'
  | 'advertising_costs'
  | 'entertainment_costs'
  | 'interest'
  | 'financial_charges'
  | 'bad_debt'
  | 'professional_fees'
  | 'depreciation'
  | 'other_expenses';

export type MtdCategory = {
  key: MtdCategoryKey;
  label: string;
  direction: 'income' | 'expense';
};

export const MTD_CATEGORIES: MtdCategory[] = [
  { key: 'turnover', label: 'Turnover', direction: 'income' },
  { key: 'other_income', label: 'Other business income', direction: 'income' },
  { key: 'cost_of_goods', label: 'Cost of goods bought for resale', direction: 'expense' },
  { key: 'cis_payments', label: 'CIS payments to subcontractors', direction: 'expense' },
  { key: 'staff_costs', label: 'Staff costs', direction: 'expense' },
  { key: 'travel_costs', label: 'Travel costs', direction: 'expense' },
  { key: 'premises_costs', label: 'Premises running costs', direction: 'expense' },
  { key: 'maintenance_costs', label: 'Repairs and maintenance', direction: 'expense' },
  { key: 'admin_costs', label: 'Administrative costs', direction: 'expense' },
  { key: 'advertising_costs', label: 'Advertising and marketing', direction: 'expense' },
  { key: 'entertainment_costs', label: 'Business entertainment costs', direction: 'expense' },
  { key: 'interest', label: 'Interest on bank/business loans', direction: 'expense' },
  { key: 'financial_charges', label: 'Bank/credit card financial charges', direction: 'expense' },
  { key: 'bad_debt', label: 'Irrecoverable debts written off', direction: 'expense' },
  { key: 'professional_fees', label: 'Professional fees', direction: 'expense' },
  { key: 'depreciation', label: 'Depreciation and loss/profit on sales', direction: 'expense' },
  { key: 'other_expenses', label: 'Other business expenses', direction: 'expense' },
];

const QUARTER_BOUNDARIES: Array<{ startMonth: number; startDay: number; endMonth: number; endDay: number }> = [
  { startMonth: 4, startDay: 6, endMonth: 7, endDay: 5 },
  { startMonth: 7, startDay: 6, endMonth: 10, endDay: 5 },
  { startMonth: 10, startDay: 6, endMonth: 1, endDay: 5 },
  { startMonth: 1, startDay: 6, endMonth: 4, endDay: 5 },
];

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function iso(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

export type MtdPeriod = {
  periodStart: string;
  periodEnd: string;
  quarterLabel: string;
  dueDate: string;
};

/** Standard-basis MTD quarter containing `dateString` (YYYY-MM-DD). */
export function quarterForDate(dateString: string): MtdPeriod {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const taxYearStart = month > 4 || (month === 4 && day >= 6) ? year : year - 1;

  for (let index = 0; index < QUARTER_BOUNDARIES.length; index += 1) {
    const bound = QUARTER_BOUNDARIES[index];
    const startYear = bound.startMonth >= 4 ? taxYearStart : taxYearStart + 1;
    const endYear = bound.endMonth < bound.startMonth ? startYear + 1 : startYear;

    const start = iso(startYear, bound.startMonth, bound.startDay);
    const end = iso(endYear, bound.endMonth, bound.endDay);

    if (date >= new Date(start) && date <= new Date(end)) {
      const due = new Date(end);
      due.setMonth(due.getMonth() + 1);
      return {
        periodStart: start,
        periodEnd: end,
        quarterLabel: `Q${index + 1} ${startYear}/${String(endYear).slice(-2)}`,
        dueDate: due.toISOString().slice(0, 10),
      };
    }
  }

  throw new Error(`Could not resolve MTD quarter for ${dateString}`);
}

/** The next MTD period after `lastPeriodEnd`, or the most recently completed period as of `today` if there isn't one. */
export function nextMtdPeriod(today: string, lastPeriodEnd?: string | null): MtdPeriod {
  if (lastPeriodEnd) {
    const dayAfter = new Date(lastPeriodEnd);
    dayAfter.setDate(dayAfter.getDate() + 1);
    return quarterForDate(dayAfter.toISOString().slice(0, 10));
  }

  const current = quarterForDate(today);
  const dayBefore = new Date(current.periodStart);
  dayBefore.setDate(dayBefore.getDate() - 1);
  return quarterForDate(dayBefore.toISOString().slice(0, 10));
}

const CATEGORY_KEYWORDS: Array<{ pattern: RegExp; category: SuggestedCategory }> = [
  { pattern: /rail|train|taxi|uber|flight|fuel|petrol|diesel|parking|mileage/i, category: 'Travel' },
  { pattern: /hotel|inn|lodging|accommodation|restaurant|meal|subsist/i, category: 'Accommodation and Meals' },
  { pattern: /stationery|printer|ink|office supplies|paper/i, category: 'Office Costs' },
  { pattern: /wholesale|supplier|materials|stock|goods for resale/i, category: 'Cost of Sales' },
  { pattern: /garage|mot|car repair|vehicle/i, category: 'Motor Expenses' },
  { pattern: /repair|maintenance|plumber|electrician/i, category: 'Repairs and Maintenance' },
  { pattern: /software|saas|subscription|licence|license/i, category: 'Software' },
  { pattern: /accountant|solicitor|legal|consultant|professional fee/i, category: 'Professional Fees' },
  { pattern: /bank charge|overdraft|card fee|finance charge/i, category: 'Bank/Finance Charges' },
  { pattern: /rent\b|lease/i, category: 'Rent' },
  { pattern: /insurance/i, category: 'Insurance' },
  { pattern: /business rates|council tax/i, category: 'Rates' },
  { pattern: /mobile|o2|ee\b|vodafone|three\b/i, category: 'Mobile Phone' },
  { pattern: /broadband|internet|telephone|wifi/i, category: 'Internet & Telephone' },
];

/** Best-effort keyword mapping from a raw statement/CSV description to a FreeAgent category. No confidence branch — every line gets a best guess, falling back to Sundries. */
export function mapToFreeAgentCategory(rawText: string): SuggestedCategory {
  for (const entry of CATEGORY_KEYWORDS) {
    if (entry.pattern.test(rawText)) {
      return entry.category;
    }
  }
  return 'Sundries';
}
