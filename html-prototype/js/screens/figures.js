/**
 * Screens 3 & 4: the client-facing micro-site — figures entry, then evidence upload.
 * Both live here since they share the step indicator + submit-gating logic.
 */

function renderFigures() {
  const t = totals();
  const isQuarter = state.view === 'quarter';

  const quarterRow = (r, inputKey) => `
    <div class="figure-row">
      <div>
        <div>${r.label}</div>
        ${state.authed ? `<div class="figure-row-prev">Last quarter ${gbp(r2(r.amt * 0.88))}</div>` : ''}
      </div>
      <input class="field figure-row-input" value="${gp(inputKey.startsWith(r.key + 'a') ? expAmt(r.key) : incVal(r.key))}"
        oninput="onQuarterFigureInput('${inputKey}', this.value)" />
    </div>
  `;

  const monthHeader = (label) => `
    <div class="figure-month-header">
      <div>${label}</div>
      ${MONTHS.map(m => `<div class="text-right">${m}</div>`).join('')}
      <div class="text-right" style="color:var(--color-primary);">Quarter</div>
    </div>
  `;

  const monthRow = (r) => `
    <div class="figure-month-row">
      <div class="figure-row-label-inline">${r.label}</div>
      ${[0, 1, 2].map(i => `<input class="field field-compact" value="${gp(mVal(r.key, i, r.amt))}" oninput="onMonthFigureInput('${r.key}', ${i}, this.value)" />`).join('')}
      <div class="text-right text-bold" data-row-quarter="${r.key}">${gp([0, 1, 2].reduce((s, i) => s + mVal(r.key, i, r.amt), 0))}</div>
    </div>
  `;

  const inner = `
    ${renderStepIndicator(1)}
    <div class="card-panel">
      <div class="card-panel-header">
        <div class="eyebrow">Making Tax Digital · Quarterly update</div>
        <h1 class="card-panel-title">Your ${PERIOD.short} figures</h1>
        <p class="card-panel-subtitle">${PRACTICE} have asked you to confirm your self-employment income and expenses for <strong>${PERIOD.range}</strong>.</p>
      </div>

      ${state.authed ? `
        <div class="callout-info" style="margin:0 28px 20px;">
          <span>👤</span>
          <div>Signed in as <strong>${FEATURED_CLIENT.contact}</strong> — we've shown last quarter's figures beneath each box for reference.</div>
        </div>
      ` : ''}

      <div class="card-panel-body">
        <div class="figures-toolbar">
          <div class="toggle-group">
            <button class="toggle-btn ${isQuarter ? 'active' : ''}" onclick="setView('quarter')">Quarter total</button>
            <button class="toggle-btn ${!isQuarter ? 'active' : ''}" onclick="setView('month')">Month by month</button>
          </div>
          <div class="text-muted text-small">All figures in £</div>
        </div>

        ${isQuarter ? `
          <div class="figure-section-header">
            <div>Income</div><div class="text-right">${PERIOD.short}</div>
          </div>
          ${INCOME.map(r => quarterRow(r, r.key)).join('')}
          <div class="figure-total-row">
            <div>Total income</div><div class="text-right js-total-income">${gbp(t.ti)}</div>
          </div>

          <div class="figure-section-header" style="margin-top:16px;">
            <div>Expenses</div><div class="text-right">${PERIOD.short}</div>
          </div>
          ${EXPENSES.map(r => quarterRow(r, r.key + 'a')).join('')}
          <div class="figure-total-row" style="border-bottom:none;">
            <div>Total expenses</div><div class="text-right js-total-expenses">${gbp(t.te)}</div>
          </div>
        ` : `
          ${monthHeader('Income')}
          ${INCOME.map(monthRow).join('')}
          <div class="figure-month-total-row">
            <div>Total income</div><div></div><div></div><div></div>
            <div class="text-right js-total-income">${gbp(t.ti)}</div>
          </div>

          ${monthHeader('Expenses')}
          ${EXPENSES.map(monthRow).join('')}
          <div class="figure-month-total-row" style="border-bottom:none;">
            <div>Total expenses</div><div></div><div></div><div></div>
            <div class="text-right js-total-expenses">${gbp(t.te)}</div>
          </div>
        `}
      </div>

      <div class="card-panel-footer">
        <div>
          <div class="text-small text-muted">Net profit this quarter</div>
          <div class="figures-net-profit js-net-profit">${gbp(t.net)}</div>
        </div>
        <div class="flex-1"></div>
        <button class="btn-cta btn-large" onclick="go('receipts')">Continue to receipts →</button>
      </div>
    </div>
  `;

  return renderMicroChrome(inner);
}

function renderReceipts() {
  if (state.microSent) {
    return renderMicroChrome(renderReceiptsDone());
  }

  const hasBankStmt = state.bankStmts.length > 0;

  const bankStmtRows = state.bankStmts.map((name, i) => `
    <div class="file-row file-row-success">
      <div class="file-icon">✓</div>
      <div class="flex-1">
        <div class="file-name">${name}</div>
        <div class="file-meta">${name.endsWith('.csv') ? '0.1' : '0.8'} MB · will be saved to Files</div>
      </div>
      <a href="javascript:void(0)" class="link-danger" onclick="removeBankStatement(${i})">Remove</a>
    </div>
  `).join('');

  const receiptRows = state.receipts.map((name, i) => `
    <div class="file-row">
      <div class="file-icon">📄</div>
      <div class="flex-1">
        <div class="file-name">${name}</div>
        <div class="file-meta">${Math.round((0.3 + i * 0.4) * 10) / 10} MB</div>
      </div>
      <a href="javascript:void(0)" class="link-danger" onclick="removeReceipt(${i})">Remove</a>
    </div>
  `).join('');

  const inner = `
    ${renderStepIndicator(2)}
    <div class="card-panel">
      <div class="card-panel-header">
        <h1 class="card-panel-title">Capture your evidence for ${PERIOD.short}</h1>
        <p class="card-panel-subtitle">Making Tax Digital requires a clear thread of evidence for the quarter. Upload the bank statement covering ${PERIOD.range} — receipts are welcome too. Everything is saved to Files on your account for ${PRACTICE} to review.</p>
      </div>

      <div class="card-panel-body">
        <div class="upload-section-title">
          <span>Bank statement</span>
          ${badge('Required', 'error')}
        </div>
        <p class="text-small text-muted">The source transactions for the period — your thread of evidence. Export from your online banking as a PDF or CSV.</p>
        <div class="dropzone ${hasBankStmt ? 'has-file' : 'needs-file'}" onclick="addBankStatement()">
          <div class="dropzone-icon">🏦</div>
          <div class="dropzone-title">Drag &amp; drop your bank statement</div>
          <div class="dropzone-sub">or click to browse · PDF or CSV · max 20MB</div>
        </div>
        ${hasBankStmt ? `<div class="file-list">${bankStmtRows}</div>` : ''}

        <div class="divider"></div>

        <div class="upload-section-title">
          <span>Receipts</span>
          ${badge('Optional', 'muted')}
        </div>
        <p class="text-small text-muted">Photos or PDFs of receipts for the quarter. We'll read them with Smart Capture and match them to your transactions.</p>
        <div class="dropzone" onclick="addReceipt()">
          <div class="dropzone-icon">📎</div>
          <div class="dropzone-title">Drag &amp; drop receipts here</div>
          <div class="dropzone-sub">or click to browse · JPG, PNG, PDF · max 10MB each</div>
        </div>
        ${state.receipts.length > 0 ? `
          <div class="mt-md">
            <div class="text-small text-bold text-secondary mb-sm">${state.receipts.length} added — these go to Files &amp; Smart Capture</div>
            <div class="file-list">${receiptRows}</div>
          </div>
        ` : ''}
      </div>

      <div class="card-panel-footer">
        <a href="javascript:void(0)" class="link-muted text-bold" onclick="go('figures')">‹ Back to figures</a>
        <div class="flex-1"></div>
        ${!hasBankStmt ? `<span class="text-warning text-small">Upload a bank statement to continue</span>` : ''}
        <button class="btn-cta btn-large" ${!hasBankStmt ? 'disabled' : ''} onclick="sendToPractice()">Send to ${PRACTICE.split(' ')[0]} &amp; Co</button>
      </div>
    </div>
  `;

  return renderMicroChrome(inner);
}

function renderReceiptsDone() {
  const receiptCount = state.receipts.length;
  const bankStmtCount = state.bankStmts.length;
  const evidenceSuffix = ', your bank statement' + (receiptCount > 0 ? (' and ' + receiptCount + ' receipts') : '');
  const t = totals();

  return `
    <div class="card-panel done-card">
      <div class="done-icon">✓</div>
      <h1>Sent, thank you ${FEATURED_CLIENT.contact}</h1>
      <p class="done-sub">${PRACTICE} now have your ${PERIOD.short} figures${evidenceSuffix}. They'll review everything and prepare your quarterly update — nothing more for you to do.</p>

      <div class="callout-info done-callout">
        <span>📁</span>
        <div>Your bank statement has been saved to <strong>Files</strong> on the FreeAgent account, filed against ${PERIOD.short}. It stays there as the evidence trail for this quarter — you and ${PRACTICE} can open it any time.</div>
      </div>

      <div class="summary-panel">
        <div class="summary-row"><span>Net profit submitted</span><span class="text-bold">${gbp(t.net)}</span></div>
        <div class="summary-row"><span>Bank statement saved to Files</span><span class="text-bold">${bankStmtCount} ${bankStmtCount === 1 ? 'file' : 'files'}</span></div>
        <div class="summary-row"><span>Receipts attached</span><span class="text-bold">${receiptCount}</span></div>
        <div class="summary-row" style="border-bottom:none;"><span>Reference</span><span class="text-bold">MTD-Q1-2026-27</span></div>
      </div>

      <button class="btn-cta btn-large mt-lg" onclick="go('tracking')">See it land in the practice ›</button>

      <div class="upsell-card">
        <div class="upsell-header">
          <span class="text-bold" style="color:#fff;">FreeAgent</span>
          <span style="color:#9fb2cc; font-size:12.5px; font-weight:600;">Make this automatic</span>
        </div>
        <div class="upsell-body">
          <div class="upsell-title">Skip the statement upload next quarter</div>
          <p>Upgrade to FreeAgent and connect your bank feed. Transactions flow in automatically as they happen, so your evidence trail builds itself — no exporting or uploading each quarter.</p>
          <div class="flex gap-lg" style="align-items:center;">
            <button class="btn-cta">Connect a bank feed</button>
            <a href="javascript:void(0)" class="link-primary text-bold">See what's included ›</a>
          </div>
        </div>
      </div>
    </div>
  `;
}
