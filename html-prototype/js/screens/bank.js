/**
 * Screen 6: Accountant's view of the client's bank account — transactions generated
 * straight from the figures the client entered, so edits on `figures` show up here too.
 */

function renderBank() {
  const dates = ['08/04/2026', '19/04/2026', '06/05/2026', '19/05/2026', '24/05/2026', '02/06/2026', '18/06/2026', '28/06/2026', '30/06/2026'];
  let di = 0, firstExp = true, running = 0;
  const txns = [];

  INCOME.forEach(r => {
    const v = incVal(r.key);
    if (v > 0) {
      running += v;
      txns.push({ date: dates[di++ % dates.length], name: r.label, coa: r.coa, inV: v, outV: 0, hasReceipt: false, bal: running });
    }
  });
  EXPENSES.forEach(r => {
    const v = expAmt(r.key);
    if (v > 0) {
      running -= v;
      const hr = firstExp; firstExp = false;
      txns.push({ date: dates[di++ % dates.length], name: r.label, coa: r.coa, inV: 0, outV: v, hasReceipt: hr, bal: running });
    }
  });

  const rows = txns.map(x => `
    <tr>
      <td><span class="checkbox-placeholder"></span></td>
      <td class="text-secondary">${x.date}</td>
      <td>
        <div class="flex-center gap-sm">
          <span class="txn-tick">✓</span>
          <span class="text-bold" style="color:var(--color-primary);">${x.name}</span>
          ${x.hasReceipt ? '<span title="Receipt attached">📎</span>' : ''}
        </div>
        <div class="text-small text-muted" style="margin-left:23px;">Explained as ${x.coa} · MTD Import rule</div>
      </td>
      <td class="text-right">${x.inV ? gp(x.inV) : ''}</td>
      <td class="text-right">${x.outV ? gp(x.outV) : ''}</td>
      <td class="text-right">${gbp(x.bal)}</td>
    </tr>
  `).join('');

  const inner = `
    <div class="main-content">
      <div class="flex-between mb-md">
        <div>
          <div class="eyebrow">Banking · ${FEATURED_CLIENT.name}</div>
          <h1 class="page-title" style="margin:0;">MTD Import</h1>
        </div>
        <div class="flex gap-sm">
          <button class="btn-secondary btn-small">Upload statement</button>
          <button class="btn-secondary btn-small">Account settings</button>
        </div>
      </div>

      <div class="bank-layout">
        <div>
          <div class="tabs mb-md">
            <div class="tab active">All transactions</div>
            <div class="tab">Unexplained <span class="badge badge-error">0</span></div>
            <div class="tab">For approval <span class="badge badge-warning">0</span></div>
            <div class="tab">Manually added</div>
          </div>

          <table class="table">
            <thead>
              <tr><th></th><th>Date</th><th>Description</th><th class="text-right">Money In</th><th class="text-right">Money Out</th><th class="text-right">Balance</th></tr>
            </thead>
            <tbody>
              <tr>
                <td></td><td></td><td class="text-muted" style="font-style:italic;">Balance brought forward</td><td></td><td></td>
                <td class="text-right text-bold">£0.00</td>
              </tr>
              ${rows}
            </tbody>
          </table>

          <div class="callout-info mt-lg">
            <div class="flex-between" style="width:100%;">
              <div>
                <div class="text-bold">All ${txns.length} transactions explained</div>
                <div class="text-small text-secondary">The ${PERIOD.short} figures are populated. Head to Income Tax to review and file the quarterly update.</div>
              </div>
              <button class="btn-primary" style="white-space:nowrap;" onclick="go('incometax')">Go to Income Tax →</button>
            </div>
          </div>
        </div>

        <div class="bank-rail">
          <div class="rail-card">
            <div class="rail-card-title">Import feed</div>
            <div class="rail-card-body">
              ${statusPill('● Active', '#e2f2e0', '#2a5d2c')}
              <div class="text-small text-muted mt-sm">Last import</div>
              <div class="text-bold">This morning</div>
              <div class="text-small text-muted">Source: MTD upload · ${FEATURED_CLIENT.contact}</div>
            </div>
          </div>
          <div class="rail-card">
            <div class="rail-card-title">Status</div>
            <div class="rail-card-body">
              <div class="rail-stat-row"><span class="text-secondary">Explained</span><span class="text-bold" style="color:var(--color-success);">${txns.length}</span></div>
              <div class="rail-stat-row"><span class="text-secondary">For approval</span><span class="text-bold">0</span></div>
              <div class="rail-stat-row"><span class="text-secondary">Unexplained</span><span class="text-bold">0</span></div>
            </div>
          </div>
          <div class="rail-card">
            <div class="rail-card-title">Bank details</div>
            <div class="rail-card-body">
              <div class="text-small text-muted">MTD Import · ${PERIOD.short}</div>
              <div class="rail-balance">${gbp(running)}</div>
              <div class="text-small text-muted">Net of ${txns.length} imported transactions</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  return renderAcctChrome(inner, 'Banking ▾');
}
