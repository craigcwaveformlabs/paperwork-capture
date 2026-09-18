export type MtdFilingCode = { label: string; nominalCode: string | null };

/**
 * Labels and FreeAgent nominal codes read from the "Quarterly filing codes" sheet of the
 * "FreeAgent MTD IT for Sole traders Non CIS" template (Top 20 + Extra code tables). These are
 * real/standard FreeAgent nominal codes, not the app's custom BRIDGING_CATEGORIES codes.
 * A null nominalCode (Disallowable Income) means "exclude from posting" — the source sheet
 * leaves it without a code.
 */
export const MTD_FILING_CODES: MtdFilingCode[] = [
  { label: 'Sales', nominalCode: '001' },
  { label: 'Disallowable Income', nominalCode: null },
  { label: 'Cost of Sales', nominalCode: '101' },
  { label: 'Net Salary Expense', nominalCode: '404' },
  { label: 'Motor Expenses', nominalCode: '283' },
  { label: 'Rent', nominalCode: '251' },
  { label: 'Office Costs', nominalCode: '250' },
  { label: 'Computer Software', nominalCode: '269' },
  { label: 'Internet & Telephone', nominalCode: '273' },
  { label: 'Mobile Phone', nominalCode: '274' },
  { label: 'Insurance', nominalCode: '364' },
  { label: 'Bank/Finance Charges', nominalCode: '363' },
  { label: 'Sundries', nominalCode: '280' },
  { label: 'Accountancy Fees', nominalCode: '292' },
  { label: 'Use of Home', nominalCode: '366' },
  { label: 'Legal and Professional Fees', nominalCode: '290' },
  { label: 'Advertising and Promotion', nominalCode: '288' },
  { label: 'Accommodation and Meals', nominalCode: '285' },
  { label: 'Travel', nominalCode: '365' },
  { label: 'Materials', nominalCode: '103' },

  { label: 'Interest Received', nominalCode: '51' },
  { label: 'Commission Paid', nominalCode: '102' },
  { label: 'Equipment Hire', nominalCode: '104' },
  { label: 'Subcontractor Costs', nominalCode: '150' },
  { label: 'Mileage', nominalCode: '249' },
  { label: 'Web Hosting', nominalCode: '268' },
  { label: 'Computer Hardware', nominalCode: '270' },
  { label: 'Office Equipment', nominalCode: '271' },
  { label: 'Other Computer Costs', nominalCode: '272' },
  { label: 'Printing', nominalCode: '276' },
  { label: 'Stationery', nominalCode: '277' },
  { label: 'Childcare Vouchers', nominalCode: '278' },
  { label: 'Staff Training', nominalCode: '282' },
  { label: 'Staff Entertaining', nominalCode: '289' },
  { label: 'Leasing Payments', nominalCode: '291' },
  { label: 'Consultancy Fees', nominalCode: '293' },
  { label: 'Business Entertaining', nominalCode: '335' },
  { label: 'Pension (Personal/Stakeholder)', nominalCode: '350' },
  { label: 'Pension (Annuity)', nominalCode: '351' },
  { label: 'Postage', nominalCode: '358' },
  { label: 'Books and Journals', nominalCode: '359' },
  { label: 'Charitable Donations', nominalCode: '360' },
  { label: 'Subscriptions', nominalCode: '361' },
  { label: 'Interest Payable', nominalCode: '362' },
  { label: 'VAT Penalty', nominalCode: '371' },
  { label: 'PAYE/NI Penalty', nominalCode: '373' },
  { label: 'Realized Currency Exchange Gain/Loss', nominalCode: '390' },
  { label: 'Unrealized Currency Exchange Gain/Loss', nominalCode: '391' },
  { label: 'Fuel Scale Charges', nominalCode: '400' },
  { label: 'Salaries', nominalCode: '401' },
  { label: 'Employer NICs', nominalCode: '402' },
  { label: 'Staff Pensions', nominalCode: '403' },
  { label: 'PAYE/NI Expense', nominalCode: '405' },
  { label: 'Bad Debts Written Off', nominalCode: '450' },
  { label: 'Depreciation Charge', nominalCode: '460' },
];

/** Strips leading zeros and whitespace so codes like "001" and "1" compare equal. */
export function normaliseNominalCode(raw: string | number): string {
  const trimmed = String(raw).trim();
  const stripped = trimmed.replace(/^0+(?=\d)/, '');
  return stripped || trimmed;
}
