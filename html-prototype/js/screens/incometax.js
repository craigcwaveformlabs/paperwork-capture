/**
 * Screen 7: Accountant's MTD-for-Income-Tax view — cumulative quarterly table,
 * annual estimate, and the "send update to HMRC" submit modal.
 */

function renderIncomeTax() {
  const t = totals();
  const est = estimate();
  const itTabs = ['Self employment', 'Annual summary', 'Employment', 'Individual information', 'Losses', 'Tax breakdown'];
  const mtdCols = [
    { name: 'Q1', covers: '06 Apr – 05 Jul 26', due: 'Due by 05 Aug 26' },
    { name: 'Q2', covers: '06 Apr – 05 Oct 26', due: 'Due by 05 Nov 26' },
    { name: 'Q3', covers: '06 Apr – 05 Jan 27', due: 'Due by 05 Feb 27' },
    { name: 'Q4', covers: '06 Apr – 05 Apr 27', due: 'Due by 05 May 27' },
    { name: 'End of Year', covers: '06 Apr – 05 Apr 27', due: 'Due by 31 Jan 28' },
    { name: 'Final Declaration', covers: '06 Apr – 05 Apr 27', due: 'Due by 31 Jan 28' },
  ];
  const q1only = (v) => [v, '', '', '', '', ''];

  const mtdRows = [];
  mtdRows.push({ label: 'Income', vals: q1only(gp(t.ti)), indent: '16px', bold: true, blue: true, band: true });
  INCOME.forEach(r => mtdRows.push({ label: r.label, vals: q1only(gp(incVal(r.key))), indent: '34px', blue: true }));
  mtdRows.push({ label: 'Expenses', vals: q1only('-' + gp(t.te)), indent: '16px', bold: true, blue: true, band: true });
  EXPENSES.filter(r => expAmt(r.key) > 0).forEach(r => mtdRows.push({ label: r.label, vals: q1only('-' + gp(expAmt(r.key))), indent: '34px', blue: true }));
  mtdRows.push({ label: 'Net Profit', vals: q1only(gp(t.net)), indent: '16px', bold: true });
  mtdRows.push({ label: 'Disallowable Expenses', vals: q1only(gp(t.td)), indent: '16px', bold: true, blue: true, band: true });
  EXPENSES.filter(r => expDis(r.key) > 0).forEach(r => mtdRows.push({ label: r.label, vals: q1only(gp(expDis(r.key))), indent: '34px', blue: true }));
  mtdRows.push({ label: 'Allowances', vals: ['', '', '', '', '', ''], indent: '16px', bold: true, blue: true, band: true });
  mtdRows.push({ label: 'Annual Investment Allowance', vals: ['', '', '', '', '', ''], indent: '34px', blue: true });
  mtdRows.push({ label: 'Taxable Profit', vals: q1only(gp(t.taxable)), indent: '16px', bold: true });

  const inner = `
    <div class="main-content">
      ${state.submitted ? `
        <div class="success-banner">
          <span class="success-icon">✓</span>
          <div><strong>Your ${PERIOD.short} quarterly update was submitted to HMRC.</strong> It may take a few minutes for HMRC to process the submission.</div>
        </div>
      ` : ''}

      <div class="flex-between mb-md" style="align-items:flex-start;">
        <h1 class="page-title" style="margin:0;">MTD for Income Tax ${PERIOD.taxYearLong} - ${FEATURED_CLIENT.contact} ▾</h1>
        <div class="flex gap-sm" style="flex-wrap:wrap;">
          <button class="btn-secondary btn-small">Export ▾</button>
          <button class="btn-secondary btn-small">Edit tax year details</button>
          <button class="btn-secondary btn-small">More ▾</button>
          ${!state.submitted ? `<button class="btn-cta btn-small" onclick="openSubmitModal()">Send update</button>` : ''}
        </div>
      </div>

      <div class="tabs mb-lg">
        ${itTabs.map((label, i) => `<div class="tab ${i === 0 ? 'active' : ''}">${label}</div>`).join('')}
      </div>

      <div class="estimate-card">
        <div>
          <div class="text-bold text-small mb-sm">Your annual tax estimate</div>
          <div class="estimate-value">${gbp(est.total)}</div>
          <div class="text-small text-muted">Last updated: 15 July 2026</div>
        </div>
        <div class="text-small text-secondary" style="line-height:1.6;">
          This estimate, provided by HMRC for informational purposes only, does not guarantee accuracy and may not reflect your final tax liability. You can request an update based on your current figures by sending your income and expenses to date.
          <div class="mt-sm"><a href="javascript:void(0)" class="link-primary">View the breakdown</a> for your current estimate provided by HMRC.</div>
        </div>
      </div>

      <div class="mtd-table">
        <div class="mtd-table-header">
          <div></div>
          ${mtdCols.map(c => `
            <div class="mtd-col-header">
              <div class="mtd-col-name">${c.name}</div>
              <div class="mtd-col-covers">${c.covers}</div>
              <div class="mtd-col-due-wrap">${badge('Due', 'warning')}</div>
              <div class="mtd-col-due">${c.due}</div>
            </div>
          `).join('')}
        </div>
        ${mtdRows.map(r => `
          <div class="mtd-row ${r.band ? 'band' : ''}">
            <div class="mtd-row-label" style="padding-left:${r.indent}; font-weight:${r.bold ? 800 : 400}; color:${r.blue ? 'var(--color-primary)' : (r.bold ? 'var(--color-text-primary)' : 'var(--color-text-secondary)')}; font-size:${r.bold ? '14px' : '13.5px'};">${r.label}</div>
            ${r.vals.map(v => `<div class="mtd-cell" style="font-weight:${r.bold ? 800 : 400};">${v}</div>`).join('')}
          </div>
        `).join('')}
      </div>
    </div>

    ${renderSubmitModal()}
  `;

  return renderAcctChrome(inner, 'Taxes ▾');
}

function renderSubmitModal() {
  if (!state.submitOpen) return '';
  const periodOptions = [
    { key: 'q1', title: 'Up to Q1', sub: '6 Apr 2026 to 5 Jul 2026' },
    { key: 'ytd', title: 'Year to date', sub: '6 Apr 2026 to 5 Jul 2026 (all periods so far)' },
  ];

  return `
    <div class="modal-overlay" onclick="if(event.target===this) closeSubmitModal()">
      <div class="modal">
        <div class="modal-header">
          <div>
            <div class="modal-title">Send update for ${PERIOD.taxYearLong}</div>
            <div class="text-small text-muted">Choose the period to report up to</div>
          </div>
          <a href="javascript:void(0)" class="modal-close" onclick="closeSubmitModal()">×</a>
        </div>
        <div class="modal-body">
          ${periodOptions.map(p => {
            const on = state.period === p.key;
            return `
              <div class="radio-option ${on ? 'selected' : ''}" onclick="setPeriod('${p.key}')">
                <span class="radio-dot-ring"><span class="radio-dot"></span></span>
                <div>
                  <div class="radio-title">${p.title}</div>
                  <div class="radio-sub">${p.sub}</div>
                </div>
              </div>
            `;
          }).join('')}
          <p class="text-small text-muted mt-sm">FreeAgent sends the income and expense category totals shown on the previous screen. Individual transactions are not sent to HMRC.</p>
        </div>
        <div class="modal-footer">
          <button class="btn-cta" onclick="confirmSubmit()">Send update to HMRC</button>
          <div class="flex-1"></div>
          <a href="javascript:void(0)" class="link-muted" onclick="closeSubmitModal()">Cancel</a>
        </div>
      </div>
    </div>
  `;
}
