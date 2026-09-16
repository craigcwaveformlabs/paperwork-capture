/**
 * Single global state object for the whole journey, plus the computed values
 * derived from it (totals, tax estimate, per-field getters/setters).
 *
 * Screens read `state` directly and call these helpers — there's no
 * component-local state anywhere in this prototype.
 */

const state = {
  screen: 'request',
  authed: true,
  view: 'quarter', // 'quarter' | 'month'
  qedits: {},      // quarter-view overrides, keyed by income/expense key
  medits: {},      // month-view overrides, keyed by `${key}_${monthIndex}`
  receipts: ['fuel-receipt-may.jpg', 'screwfix-19may.jpg', 'rsm-invoice.pdf'],
  bankStmts: [],
  microSent: false,
  sendMode: 'auto',
  mSubmitted: false,
  submitOpen: false,
  submitted: false,
  period: 'q1',
};

function go(screen) {
  if (screen === 'figures' || screen === 'receipts') state.microSent = false;
  state.screen = screen;
  state.submitOpen = false;
  rerender();
  window.scrollTo(0, 0);
}

function incVal(key) {
  const d = INCOME.find(x => x.key === key);
  const e = state.qedits[key];
  return e !== undefined ? parseNum(e) : d.amt;
}

function expAmt(key) {
  const d = EXPENSES.find(x => x.key === key);
  const e = state.qedits[key + 'a'];
  return e !== undefined ? parseNum(e) : d.amt;
}

function expDis(key) {
  const d = EXPENSES.find(x => x.key === key);
  const e = state.qedits[key + 'd'];
  return e !== undefined ? parseNum(e) : d.dis;
}

function setQ(key, value) {
  state.qedits[key] = value;
}

function mVal(key, i, amt) {
  const e = state.medits[key + '_' + i];
  return e !== undefined ? parseNum(e) : splitQuarter(amt)[i];
}

function setM(key, i, value) {
  state.medits[key + '_' + i] = value;
}

function totals() {
  const ti = INCOME.reduce((s, r) => s + incVal(r.key), 0);
  const te = EXPENSES.reduce((s, r) => s + expAmt(r.key), 0);
  const td = EXPENSES.reduce((s, r) => s + expDis(r.key), 0);
  return { ti, te, td, net: ti - te, taxable: (ti - te) + td };
}

function estimate() {
  const t = totals();
  const annual = t.taxable * 4;
  const PA = 12570;
  const taxableAfterAllowance = Math.max(0, annual - PA);
  const incomeTax = Math.min(taxableAfterAllowance, 37700) * 0.20
    + Math.max(0, taxableAfterAllowance - 37700) * 0.40;
  const class4 = Math.max(0, Math.min(annual, 50270) - 12570) * 0.06
    + Math.max(0, annual - 50270) * 0.02;
  return { incomeTax, class4, total: incomeTax + class4, annual };
}

function addReceipt() {
  const pool = ['bq-newcastle-jun.jpg', 'farm-supplies.pdf', 'parking-may.jpg', 'sundry-jun.jpg'];
  state.receipts.push(pool[state.receipts.length % pool.length]);
  rerender();
}

function removeReceipt(i) {
  state.receipts.splice(i, 1);
  rerender();
}

function addBankStatement() {
  const pool = ['natwest-statement-q1-2026.pdf', 'natwest-transactions-q1.csv'];
  state.bankStmts.push(pool[state.bankStmts.length % pool.length]);
  rerender();
}

function removeBankStatement(i) {
  state.bankStmts.splice(i, 1);
  rerender();
}

function setView(view) {
  state.view = view;
  rerender();
}

function setSendMode(mode) {
  state.sendMode = mode;
  rerender();
}

function setPeriod(period) {
  state.period = period;
  rerender();
}

function sendToPractice() {
  if (state.bankStmts.length > 0) {
    state.microSent = true;
    rerender();
  }
}

function openSubmitModal() {
  state.submitOpen = true;
  rerender();
}

function closeSubmitModal() {
  state.submitOpen = false;
  rerender();
}

function confirmSubmit() {
  state.submitOpen = false;
  state.submitted = true;
  rerender();
}

function submitMobile() {
  state.mSubmitted = true;
  go('mDone');
}
