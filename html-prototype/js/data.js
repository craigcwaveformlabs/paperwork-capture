/**
 * Static content for the MTD Quarterly Capture prototype.
 * Edit the arrays below to change what shows up across every screen —
 * the bank account, income tax table, and figures forms are all derived from these.
 */

const CLIENTS = [
  { name: 'Marsden Farms', contact: 'Alan Marsden', email: 'alan@marsdenfarms.co.uk', tag: 'Sole trader' },
  { name: 'Oakfield Joinery', contact: 'Dave Oak', email: 'dave@oakfieldjoinery.co.uk', tag: 'Sole trader' },
  { name: 'Copper & Reed Design', contact: 'Sara Reed', email: 'sara@copperreed.co.uk', tag: 'Sole trader' },
];

const INCOME = [
  { key: 'inc0', label: 'Turnover', amt: 13920.00, coa: 'Sales' },
  { key: 'inc1', label: 'Other income', amt: 10273.36, coa: 'Other Income' },
];

const EXPENSES = [
  { key: 'e0', label: 'Cost of goods bought', amt: 15.98, dis: 1.60, coa: 'Cost of Sales' },
  { key: 'e1', label: 'CIS payments to sub-contractors', amt: 0.00, dis: 0.00, coa: 'Subcontractors' },
  { key: 'e2', label: 'Staff costs', amt: 20.00, dis: 2.00, coa: 'Salaries' },
  { key: 'e3', label: 'Travel costs', amt: 0.00, dis: 0.00, coa: 'Travel' },
  { key: 'e4', label: "Premises' running costs", amt: 0.00, dis: 0.00, coa: 'Premises Costs' },
  { key: 'e5', label: 'Maintenance costs', amt: 34.98, dis: 3.50, coa: 'Repairs & Maintenance' },
  { key: 'e6', label: 'Administration costs', amt: 0.00, dis: 0.00, coa: 'Office Costs' },
  { key: 'e7', label: 'Advertising costs', amt: 0.00, dis: 0.00, coa: 'Advertising' },
  { key: 'e8', label: 'Business entertainment costs', amt: 0.00, dis: 0.00, coa: 'Entertaining' },
  { key: 'e9', label: 'Interest', amt: 0.00, dis: 0.00, coa: 'Interest Payable' },
  { key: 'e10', label: 'Financial charges', amt: 0.00, dis: 0.00, coa: 'Bank Charges' },
  { key: 'e11', label: 'Bad debt', amt: 14.99, dis: 1.50, coa: 'Bad Debts' },
  { key: 'e12', label: 'Professional fees', amt: 1299.60, dis: 129.96, coa: 'Accountancy Fees' },
  { key: 'e13', label: 'Depreciation', amt: 0.00, dis: 0.00, coa: 'Depreciation' },
  { key: 'e14', label: 'Other business expenses', amt: 788.46, dis: 78.85, coa: 'Sundry Expenses' },
];

const MONTHS = ['6 Apr–5 May', '6 May–5 Jun', '6 Jun–5 Jul'];

const PRACTICE = 'Riverside & Co Accountants';

const PERIOD = {
  range: '6 Apr – 5 Jul 2026',
  short: 'Q1 2026-27',
  taxYear: '2026-27',
  taxYearLong: '2026/27',
};

function initials(name) {
  return name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

const FEATURED_CLIENT = {
  name: CLIENTS[0].name,
  contact: CLIENTS[0].contact,
  email: CLIENTS[0].email,
  initials: initials(CLIENTS[0].contact),
};

function gbp(n) {
  return '£' + Number(n).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function gp(n) {
  return Number(n).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseNum(v) {
  const n = parseFloat(String(v).replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? 0 : n;
}

function r2(n) {
  return Math.round(n * 100) / 100;
}

function splitQuarter(amt) {
  const a = r2(amt * 0.32);
  const b = r2(amt * 0.33);
  return [a, b, r2(amt - a - b)];
}
