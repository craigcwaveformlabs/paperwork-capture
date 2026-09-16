import { apiRequest } from './client';
import { addTrackedCategoryId, getTrackedCategoryIds, removeTrackedCategoryId, renameTrackedCategoryId } from './bridgingCategoryIds';

/**
 * Custom categories for transactions posted via the MTD spreadsheet bridging
 * import, kept distinct from the practice's own bookkeeping categories so
 * bridging-sourced ledger entries stay identifiable. Nominal codes were picked
 * to avoid every code already in use in the sandbox account this was built
 * against — ported verbatim from freeagent-import/bin/create-bridging-categories.js.
 */
export const BRIDGING_CATEGORIES = [
  { description: 'bridging-sales', nominal_code: '010', category_group: 'income', filing_analysis_label: 'Sales' },
  { description: 'bridging-cis-income', nominal_code: '011', category_group: 'income', filing_analysis_label: 'CIS Income' },
  { description: 'bridging-disallowable-income', nominal_code: '012', category_group: 'income', filing_analysis_label: 'Disallowable Income' },

  { description: 'bridging-cost-of-sales', nominal_code: '160', category_group: 'cost_of_sales', tax_reporting_name: 'cost_of_goods', allowable_for_tax: true, filing_analysis_label: 'Cost of Sales' },
  { description: 'bridging-cis-deductions', nominal_code: '161', category_group: 'cost_of_sales', tax_reporting_name: 'subcontractor_costs', allowable_for_tax: true, filing_analysis_label: 'CIS Deductions' },

  { description: 'bridging-net-salary-expense', nominal_code: '300', category_group: 'admin_expenses', tax_reporting_name: 'wages_salaries_and_staff_costs', allowable_for_tax: true, filing_analysis_label: 'Net Salary Expense' },
  { description: 'bridging-motor-expenses', nominal_code: '301', category_group: 'admin_expenses', tax_reporting_name: 'car_van_and_travel_expenses', allowable_for_tax: true, filing_analysis_label: 'Motor Expenses' },
  { description: 'bridging-rent', nominal_code: '302', category_group: 'admin_expenses', tax_reporting_name: 'rent_and_other_property_costs', allowable_for_tax: true, filing_analysis_label: 'Rent' },
  { description: 'bridging-office-costs', nominal_code: '303', category_group: 'admin_expenses', tax_reporting_name: 'phone_and_other_office_costs', allowable_for_tax: true, filing_analysis_label: 'Office Costs' },
  { description: 'bridging-internet-telephone', nominal_code: '304', category_group: 'admin_expenses', tax_reporting_name: 'phone_and_other_office_costs', allowable_for_tax: true, filing_analysis_label: 'Internet & Telephone' },
  { description: 'bridging-advertising-promotion', nominal_code: '305', category_group: 'admin_expenses', tax_reporting_name: 'advertising_costs', allowable_for_tax: true, filing_analysis_label: 'Advertising and Promotion' },
  { description: 'bridging-business-entertaining', nominal_code: '306', category_group: 'admin_expenses', tax_reporting_name: 'entertainment_costs', allowable_for_tax: true, filing_analysis_label: 'Business Entertaining' },
  { description: 'bridging-interest-payable', nominal_code: '307', category_group: 'admin_expenses', tax_reporting_name: 'bank_and_loan_interest', allowable_for_tax: true, filing_analysis_label: 'Interest Payable' },
  { description: 'bridging-bank-finance-charges', nominal_code: '308', category_group: 'admin_expenses', tax_reporting_name: 'other_finance_charges', allowable_for_tax: true, filing_analysis_label: 'Bank/Finance Charges' },
  { description: 'bridging-bad-debts-written-off', nominal_code: '309', category_group: 'admin_expenses', tax_reporting_name: 'debts_written_off', allowable_for_tax: true, filing_analysis_label: 'Bad Debts Written Off' },
  { description: 'bridging-accountancy-fees', nominal_code: '310', category_group: 'admin_expenses', tax_reporting_name: 'accountancy_and_legal_fees', allowable_for_tax: true, filing_analysis_label: 'Accountancy Fees' },
  { description: 'bridging-depreciation', nominal_code: '311', category_group: 'admin_expenses', tax_reporting_name: 'depreciation_and_loss_profit_on_sale', allowable_for_tax: true, filing_analysis_label: 'Depreciation' },
  { description: 'bridging-depreciation-charge', nominal_code: '312', category_group: 'admin_expenses', tax_reporting_name: 'depreciation_and_loss_profit_on_sale', allowable_for_tax: true, filing_analysis_label: 'Depreciation Charge' },
  // Deliberately excluded from the Income Tax filing — kept not-allowable-for-tax.
  { description: 'bridging-disallowable-expenses', nominal_code: '313', category_group: 'admin_expenses', tax_reporting_name: 'other_business_expenses', allowable_for_tax: false, filing_analysis_label: 'Disallowable Expenses' },
  // Not part of HMRC's own filing-analysis list — covers rows like "Capital Introduced" that the template author flagged to exclude from the filing entirely.
  { description: 'bridging-excluded-non-taxable', nominal_code: '314', category_group: 'general', allowable_for_tax: false, filing_analysis_label: 'Exclude for Income Tax filing' },
] as const;

/** Looks up the bridging-category preset whose filing_analysis_label matches (trim + case-insensitive). */
export function categoryForFilingLabel(label: string) {
  const normalised = label.trim().toLowerCase();
  return BRIDGING_CATEGORIES.find((c) => c.filing_analysis_label.toLowerCase() === normalised);
}

const GROUPS = ['income_categories', 'cost_of_sales_categories', 'admin_expenses_categories', 'general_categories'] as const;

export type FreeAgentCategory = {
  url: string;
  description: string;
  nominal_code: string;
};

export type CategoryGroups = Partial<Record<(typeof GROUPS)[number], FreeAgentCategory[]>>;

/** The four groups a custom category can be created/edited under. */
export const EDITABLE_CATEGORY_GROUPS = ['income', 'cost_of_sales', 'admin_expenses', 'general'] as const;
export type EditableCategoryGroup = (typeof EDITABLE_CATEGORY_GROUPS)[number];

export async function listCategories(): Promise<CategoryGroups> {
  return apiRequest<CategoryGroups>('/categories');
}

/**
 * Every category managed through this app's Categories CRUD UI, flattened across groups.
 * Identified by nominal code (== FreeAgent's category id), not by description, since the
 * description is user-editable and shouldn't affect whether a category stays visible here.
 */
export async function listBridgingCategories(): Promise<FreeAgentCategory[]> {
  const tracked = new Set([...BRIDGING_CATEGORIES.map((c) => c.nominal_code), ...getTrackedCategoryIds()]);
  const groups = await listCategories();
  return GROUPS.flatMap((g) => groups[g] ?? []).filter((c) => tracked.has(c.nominal_code));
}

/** Extracts the numeric id FreeAgent expects on /categories/:id from a category's full URL. */
export function categoryIdFromUrl(url: string): string {
  return url.split('/').filter(Boolean).pop()!;
}

export async function createCategory(input: {
  description: string;
  nominalCode: string;
  categoryGroup: EditableCategoryGroup;
  taxReportingName?: string;
}): Promise<void> {
  await apiRequest('/categories', {
    method: 'POST',
    body: {
      category: {
        description: input.description,
        nominal_code: input.nominalCode,
        category_group: input.categoryGroup,
        ...(input.taxReportingName ? { tax_reporting_name: input.taxReportingName } : {}),
      },
    },
  });
  addTrackedCategoryId(input.nominalCode);
}

export async function updateCategory(
  id: string,
  input: { description: string; nominalCode: string; taxReportingName?: string },
): Promise<void> {
  await apiRequest(`/categories/${id}`, {
    method: 'PUT',
    body: {
      category: {
        description: input.description,
        nominal_code: input.nominalCode,
        ...(input.taxReportingName ? { tax_reporting_name: input.taxReportingName } : {}),
      },
    },
  });
  renameTrackedCategoryId(id, input.nominalCode);
}

export async function deleteCategory(id: string): Promise<void> {
  await apiRequest(`/categories/${id}`, { method: 'DELETE' });
  removeTrackedCategoryId(id);
}

/** Flat description -> URL map across every group, for resolving CSV category names. */
export async function categoryUrlByDescription(): Promise<Map<string, string>> {
  const groups = await listCategories();
  const map = new Map<string, string>();
  for (const group of GROUPS) {
    for (const category of groups[group] ?? []) {
      map.set(category.description, category.url);
    }
  }
  return map;
}

export type BridgingCategoryResult = {
  description: string;
  nominal_code: string;
  status: 'created' | 'skipped' | 'failed';
  detail?: string;
};

/** Creates every bridging category not already present (by nominal code). */
export async function createBridgingCategories(): Promise<BridgingCategoryResult[]> {
  const existing = await listCategories();
  const existingCodes = new Set(GROUPS.flatMap((g) => (existing[g] ?? []).map((c) => c.nominal_code)));

  const results: BridgingCategoryResult[] = [];
  for (const category of BRIDGING_CATEGORIES) {
    if (existingCodes.has(category.nominal_code)) {
      results.push({ description: category.description, nominal_code: category.nominal_code, status: 'skipped', detail: 'nominal code already in use' });
      continue;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- destructured only to omit it from the API payload
      const { filing_analysis_label: _filingAnalysisLabel, ...categoryPayload } = category;
      await apiRequest('/categories', { method: 'POST', body: { category: categoryPayload } });
      addTrackedCategoryId(category.nominal_code);
      results.push({ description: category.description, nominal_code: category.nominal_code, status: 'created' });
    } catch (err) {
      results.push({ description: category.description, nominal_code: category.nominal_code, status: 'failed', detail: (err as Error).message });
    }
  }
  return results;
}
