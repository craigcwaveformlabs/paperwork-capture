import { apiRequest } from '../src/client.js';

/**
 * Custom categories for transactions posted via the MTD spreadsheet bridging
 * import, kept distinct from the practice's own bookkeeping categories so
 * bridging-sourced ledger entries stay identifiable. One entry per row in
 * html-prototype's 'Quarterly filing codes' sheet — nominal codes were
 * picked to avoid every code already in use in this sandbox account
 * (see `node bin/categories.js`).
 */
const CATEGORIES = [
  { description: 'bridging-sales', nominal_code: '010', category_group: 'income' },
  { description: 'bridging-cis-income', nominal_code: '011', category_group: 'income' },
  { description: 'bridging-disallowable-income', nominal_code: '012', category_group: 'income' },

  // tax_reporting_name is required by FreeAgent for cost_of_sales/admin_expenses
  // categories on this sandbox's UK Sole Trader company (income categories don't
  // need it). Values below are the closest match from FreeAgent's UK Sole Trader
  // allowed list — a few are judgment calls where there's no exact equivalent:
  //   - bridging-internet-telephone shares phone_and_other_office_costs with
  //     bridging-office-costs (no separate telecom box for sole traders)
  //   - bridging-disallowable-expenses uses other_business_expenses as a
  //     catch-all (no "disallowable" tax_reporting_name exists)
  { description: 'bridging-cost-of-sales', nominal_code: '160', category_group: 'cost_of_sales', tax_reporting_name: 'cost_of_goods', allowable_for_tax: true },
  { description: 'bridging-cis-deductions', nominal_code: '161', category_group: 'cost_of_sales', tax_reporting_name: 'subcontractor_costs', allowable_for_tax: true },

  { description: 'bridging-net-salary-expense', nominal_code: '300', category_group: 'admin_expenses', tax_reporting_name: 'wages_salaries_and_staff_costs', allowable_for_tax: true },
  { description: 'bridging-motor-expenses', nominal_code: '301', category_group: 'admin_expenses', tax_reporting_name: 'car_van_and_travel_expenses', allowable_for_tax: true },
  { description: 'bridging-rent', nominal_code: '302', category_group: 'admin_expenses', tax_reporting_name: 'rent_and_other_property_costs', allowable_for_tax: true },
  { description: 'bridging-office-costs', nominal_code: '303', category_group: 'admin_expenses', tax_reporting_name: 'phone_and_other_office_costs', allowable_for_tax: true },
  { description: 'bridging-internet-telephone', nominal_code: '304', category_group: 'admin_expenses', tax_reporting_name: 'phone_and_other_office_costs', allowable_for_tax: true },
  { description: 'bridging-advertising-promotion', nominal_code: '305', category_group: 'admin_expenses', tax_reporting_name: 'advertising_costs', allowable_for_tax: true },
  { description: 'bridging-business-entertaining', nominal_code: '306', category_group: 'admin_expenses', tax_reporting_name: 'entertainment_costs', allowable_for_tax: true },
  { description: 'bridging-interest-payable', nominal_code: '307', category_group: 'admin_expenses', tax_reporting_name: 'bank_and_loan_interest', allowable_for_tax: true },
  { description: 'bridging-bank-finance-charges', nominal_code: '308', category_group: 'admin_expenses', tax_reporting_name: 'other_finance_charges', allowable_for_tax: true },
  { description: 'bridging-bad-debts-written-off', nominal_code: '309', category_group: 'admin_expenses', tax_reporting_name: 'debts_written_off', allowable_for_tax: true },
  { description: 'bridging-accountancy-fees', nominal_code: '310', category_group: 'admin_expenses', tax_reporting_name: 'accountancy_and_legal_fees', allowable_for_tax: true },
  { description: 'bridging-depreciation', nominal_code: '311', category_group: 'admin_expenses', tax_reporting_name: 'depreciation_and_loss_profit_on_sale', allowable_for_tax: true },
  { description: 'bridging-depreciation-charge', nominal_code: '312', category_group: 'admin_expenses', tax_reporting_name: 'depreciation_and_loss_profit_on_sale', allowable_for_tax: true },
  // Deliberately excluded from the Income Tax filing — kept not-allowable-for-tax.
  { description: 'bridging-disallowable-expenses', nominal_code: '313', category_group: 'admin_expenses', tax_reporting_name: 'other_business_expenses', allowable_for_tax: false },
];

const GROUPS = ['income_categories', 'cost_of_sales_categories', 'admin_expenses_categories', 'general_categories'];
const dryRun = process.argv.includes('--dry-run');

const existing = await apiRequest('/categories');
const existingCodes = new Set(GROUPS.flatMap((g) => (existing[g] ?? []).map((c) => c.nominal_code)));

for (const category of CATEGORIES) {
  if (existingCodes.has(category.nominal_code)) {
    console.log(`skip  ${category.nominal_code}\t${category.description}\t(nominal code already in use)`);
    continue;
  }

  if (dryRun) {
    console.log(`would create  ${category.nominal_code}\t${category.description}\t${category.category_group}`);
    continue;
  }

  try {
    const result = await apiRequest('/categories', {
      method: 'POST',
      body: { category },
    });
    // Response is keyed by group, e.g. { cost_of_sales_categories: {...} }.
    const created = result?.[Object.keys(result)[0]] ?? {};
    console.log(`created  ${created.nominal_code ?? category.nominal_code}\t${created.description ?? category.description}\t${created.url ?? ''}`);
  } catch (err) {
    console.log(`FAILED  ${category.nominal_code}\t${category.description}\t${err.message}`);
  }
}
