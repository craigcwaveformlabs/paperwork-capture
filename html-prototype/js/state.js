/**
 * Single global state object for the whole journey, plus the computed values
 * derived from it (totals, tax estimate, per-field getters/setters).
 *
 * Screens read `state` directly and call these helpers — there's no
 * component-local state anywhere in this prototype.
 */

const state = {
  screen: 'clientList',
  selectedClientIds: [],
  groupFilter: 'all',
  editingClientId: null,
  authed: true,
  receipts: ['fuel-receipt-may.jpg', 'screwfix-19may.jpg', 'rsm-invoice.pdf'],
  pathway: null,      // null | 'paper' | 'spreadsheet' — chosen on the step 3 pathway screen
  shoeboxFiles: [],
  paperSent: false,
  mtdFile: null,
  mtdSent: false,
  sendMode: 'auto',
  mSubmitted: false,
  submitOpen: false,
  submitted: false,
  period: 'q1',
};

function go(screen) {
  if (screen === 'figures') { state.paperSent = false; state.mtdSent = false; }
  state.screen = screen;
  state.submitOpen = false;
  rerender();
  window.scrollTo(0, 0);
}

function incVal(key) {
  return INCOME.find(x => x.key === key).amt;
}

function expAmt(key) {
  return EXPENSES.find(x => x.key === key).amt;
}

function expDis(key) {
  return EXPENSES.find(x => x.key === key).dis;
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

function choosePathway(p) {
  state.pathway = p;
  go(p === 'paper' ? 'paper' : 'mtdSheet');
}

function addShoeboxFile() {
  const pool = ['natwest-statement-q1.pdf', 'fuel-receipt.jpg', 'sales-invoice-1042.pdf', 'purchase-invoice-887.pdf'];
  state.shoeboxFiles.push(pool[state.shoeboxFiles.length % pool.length]);
  rerender();
}

function removeShoeboxFile(i) {
  state.shoeboxFiles.splice(i, 1);
  rerender();
}

function sendShoebox() {
  if (state.shoeboxFiles.length > 0) {
    state.paperSent = true;
    rerender();
  }
}

function uploadMtdSheet() {
  state.mtdFile = 'q1-2026-27-mtd-figures.xlsx';
  rerender();
}

function removeMtdSheet() {
  state.mtdFile = null;
  rerender();
}

function sendMtdSheet() {
  if (state.mtdFile) {
    state.mtdSent = true;
    rerender();
  }
}

function setSendMode(mode) {
  state.sendMode = mode;
  rerender();
}

function setPeriod(period) {
  state.period = period;
  rerender();
}

function toggleClientSelected(id) {
  const i = state.selectedClientIds.indexOf(id);
  if (i === -1) state.selectedClientIds.push(id);
  else state.selectedClientIds.splice(i, 1);
  rerender();
}

function clearClientSelection() {
  state.selectedClientIds = [];
  rerender();
}

function setGroupFilter(v) {
  state.groupFilter = v;
  rerender();
}

function goToClientEdit(id) {
  state.editingClientId = id;
  go('clientEdit');
}

function toggleBridgingMode(id) {
  const client = CLIENTS.find(c => c.id === id);
  client.bridgingMode = !client.bridgingMode;
  rerender();
}

function toggleEmailSetting(id, key) {
  const client = CLIENTS.find(c => c.id === id);
  client.emailSettings[key] = !client.emailSettings[key];
  rerender();
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
