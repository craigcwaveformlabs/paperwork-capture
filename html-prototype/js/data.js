/**
 * Static content for the MTD Quarterly Capture prototype.
 * Edit the arrays below to change what shows up across every screen —
 * the bank account, income tax table, and figures forms are all derived from these.
 */

const CLIENTS = [
  { id: 'marsden-farms', name: 'Marsden Farms', contact: 'Alan Marsden', email: 'alan@marsdenfarms.co.uk',
    tag: 'Sole trader', accountType: 'Sole Trader', accountManager: 'James Okafor',
    bookkeeping: { count: 22, level: 'attention' }, compliance: 'attention', businessHealth: 'strained',
    bridgingMode: false, emailSettings: { quarterlyReminders: true, chaseOverdue: true, ccAccountManager: false } },
  { id: 'oakfield-joinery', name: 'Oakfield Joinery', contact: 'Dave Oak', email: 'dave@oakfieldjoinery.co.uk',
    tag: 'Sole trader', accountType: 'Sole Trader', accountManager: 'Priya Nair',
    bookkeeping: { count: 30, level: 'attention' }, compliance: 'on-track', businessHealth: 'strained',
    bridgingMode: false, emailSettings: { quarterlyReminders: true, chaseOverdue: false, ccAccountManager: false } },
  { id: 'copper-reed', name: 'Copper & Reed Design', contact: 'Sara Reed', email: 'sara@copperreed.co.uk',
    tag: 'Sole trader', accountType: 'Sole Trader', accountManager: 'James Okafor',
    bookkeeping: { count: 12, level: 'on-track' }, compliance: 'on-track', businessHealth: 'on-track',
    bridgingMode: false, emailSettings: { quarterlyReminders: true, chaseOverdue: true, ccAccountManager: true } },
  { id: 'kestrel-fitness', name: 'Kestrel Fitness', contact: 'Tom Fairweather', email: 'tom@kestrelfitness.co.uk',
    tag: 'Limited company', accountType: 'Limited Company', accountManager: 'James Okafor',
    bookkeeping: { count: 48, level: 'attention' }, compliance: 'attention', businessHealth: 'strained',
    bridgingMode: false, emailSettings: { quarterlyReminders: true, chaseOverdue: true, ccAccountManager: false } },
  { id: 'meridian-studios', name: 'Meridian Studios', contact: 'Priya Chandra', email: 'priya@meridianstudios.co.uk',
    tag: 'Limited company', accountType: 'Limited Company', accountManager: 'Priya Nair',
    bookkeeping: { count: 54, level: 'attention' }, compliance: 'on-track', businessHealth: 'strained',
    bridgingMode: false, emailSettings: { quarterlyReminders: true, chaseOverdue: false, ccAccountManager: true } },
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
