/**
 * Mobile app screens (all 7), rendered inside the phone-frame chrome.
 */

function renderMobile(screen) {
  let content = '';
  let showTabs = false;

  switch (screen) {
    case 'mDownload': content = renderMDownload(); break;
    case 'mSignin': content = renderMSignin(); break;
    case 'mHome': content = renderMHome(); showTabs = true; break;
    case 'mFigures': content = renderMFigures(); break;
    case 'mReceipts': content = renderMReceipts(); break;
    case 'mDone': content = renderMDone(); break;
    case 'mRequests': content = renderMRequests(); showTabs = true; break;
  }

  return renderPhoneFrame(content, showTabs);
}

function renderMDownload() {
  return `
    <div class="m-pad">
      <div class="m-app-hero">
        <div class="m-app-icon">fa</div>
        <div class="m-app-name">FreeAgent</div>
        <div class="text-muted">Accounting on the go</div>
      </div>
      <div class="m-card">
        <div class="flex-between mb-md">
          <div>
            <div class="text-small text-muted">Invited by</div>
            <div class="text-bold">Riverside &amp; Co Accountants</div>
          </div>
          <button class="btn-primary" style="border-radius:20px;" onclick="go('mSignin')">GET</button>
        </div>
        <div class="m-app-stats">
          <div><div class="text-bold">4.7 ★</div>12k ratings</div>
          <div><div class="text-bold">Age 4+</div>Finance</div>
          <div><div class="text-bold">#3</div>Business</div>
        </div>
      </div>
      <p class="text-small text-muted text-center">Download the app, then sign in with the email your accountant used to invite you.</p>
    </div>
  `;
}

function renderMSignin() {
  return `
    <div class="m-pad">
      <div class="m-app-icon m-app-icon-small">fa</div>
      <h1 class="m-h1 text-center">Welcome</h1>
      <p class="text-center text-muted mb-lg">Sign in to submit your MTD figures</p>
      <div class="m-card" style="padding:0; overflow:hidden;">
        <div class="m-field-row">
          <div class="text-small text-muted">Email</div>
          <div class="m-field-value">${FEATURED_CLIENT.email}</div>
        </div>
        <div class="m-field-row" style="border-bottom:none;">
          <div class="text-small text-muted">Password</div>
          <div class="m-field-value">••••••••</div>
        </div>
      </div>
      <button class="btn-cta btn-full mt-lg" onclick="go('mHome')">Sign in</button>
      <p class="text-small text-muted text-center mt-md">Your accountant gave you a Level 2 login — you can submit figures and see your requests.</p>
    </div>
  `;
}

function renderMHome() {
  const statusLabel = state.mSubmitted ? 'Submitted' : 'Action needed';
  return `
    <div class="m-pad-tight">
      <h1 class="m-h1 text-center">${FEATURED_CLIENT.name}</h1>
      <div class="m-card m-card-clickable" onclick="go('${state.mSubmitted ? 'mRequests' : 'mFigures'}')">
        <div class="flex-between">
          <div>
            <div class="m-card-title">MTD upload</div>
            <div class="text-muted">${PERIOD.short} · Due 7 Aug 2026</div>
          </div>
          <span class="m-chevron">›</span>
        </div>
        <div class="mt-md">${statusPill(statusLabel, state.mSubmitted ? '#e2f2e0' : '#fdecec', state.mSubmitted ? '#2a5d2c' : '#c23b3b')}</div>
      </div>
      <div class="m-card" style="padding:0;">
        <div class="flex-between" style="padding:16px 18px;">
          <div>
            <div class="m-card-title">Expenses</div>
            <div class="text-muted">${FEATURED_CLIENT.contact}</div>
          </div>
          <span class="m-chevron">›</span>
        </div>
        <div class="flex" style="border-top:1px solid var(--color-border-light);">
          <div class="m-stat-cell" style="border-right:1px solid var(--color-border-light);">
            <div class="text-small text-muted">Last 3 months</div>
            <div class="m-stat-value">£0.00</div>
          </div>
          <div class="m-stat-cell">
            <div class="text-small text-muted">Balance owed</div>
            <div class="m-stat-value">£0.00</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderMFigures() {
  const t = totals();
  const isQuarter = state.view === 'quarter';

  const quarterListRow = (r, inputKey, val) => `
    <div class="m-list-row">
      <div class="flex-1">
        <div>${r.label}</div>
        <div class="text-small text-muted">Last quarter ${gbp(r2(r.amt * 0.88))}</div>
      </div>
      <span class="text-muted">£</span>
      <input class="iosf m-iosf" value="${gp(val)}" oninput="onQuarterFigureInput('${inputKey}', this.value)" />
    </div>
  `;

  const monthCard = (r) => `
    <div class="m-card mb-sm" style="overflow:hidden;">
      <div class="flex-between" style="padding:11px 16px; border-bottom:1px solid var(--color-border-light);">
        <span class="text-bold">${r.label}</span>
        <span class="text-bold" style="color:var(--color-primary);" data-row-quarter="${r.key}">${gp([0, 1, 2].reduce((s, i) => s + mVal(r.key, i, r.amt), 0))}</span>
      </div>
      ${[0, 1, 2].map(i => `
        <div class="flex-center gap-sm" style="padding:9px 16px 9px 26px; border-bottom:1px solid var(--color-border-light);">
          <span class="flex-1 text-small text-muted">${MONTHS[i]}</span>
          <span class="text-muted">£</span>
          <input class="iosf m-iosf" value="${gp(mVal(r.key, i, r.amt))}" oninput="onMonthFigureInput('${r.key}', ${i}, this.value)" />
        </div>
      `).join('')}
    </div>
  `;

  return `
    <div>
      <div class="m-topbar">
        <a href="javascript:void(0)" class="link-primary" onclick="go('mHome')">‹ Home</a>
        <span class="text-bold">MTD upload</span>
        <span style="width:44px;"></span>
      </div>
      <div class="text-center text-small text-muted mb-md">${PERIOD.short} · ${PERIOD.range}</div>
      <div class="m-pad-tight">
        <div class="toggle-group mb-md">
          <button class="toggle-btn flex-1 ${isQuarter ? 'active' : ''}" onclick="setView('quarter')">Quarter</button>
          <button class="toggle-btn flex-1 ${!isQuarter ? 'active' : ''}" onclick="setView('month')">Monthly</button>
        </div>

        ${isQuarter ? `
          <div class="section-label">Income</div>
          <div class="m-card" style="padding:0; overflow:hidden;">
            ${INCOME.map(r => quarterListRow(r, r.key, incVal(r.key))).join('')}
            <div class="flex-between" style="padding:12px 16px; background:var(--color-surface-alt);">
              <span class="text-bold">Total income</span><span class="text-bold js-total-income">${gbp(t.ti)}</span>
            </div>
          </div>
          <div class="section-label mt-md">Expenses</div>
          <div class="m-card" style="padding:0; overflow:hidden;">
            ${EXPENSES.map(r => quarterListRow(r, r.key + 'a', expAmt(r.key))).join('')}
            <div class="flex-between" style="padding:12px 16px; background:var(--color-surface-alt);">
              <span class="text-bold">Total expenses</span><span class="text-bold js-total-expenses">${gbp(t.te)}</span>
            </div>
          </div>
        ` : `
          <div class="section-label">Income</div>
          ${INCOME.map(monthCard).join('')}
          <div class="section-label mt-md">Expenses</div>
          ${EXPENSES.map(monthCard).join('')}
        `}

        <div class="flex-between m-net-banner mt-md">
          <span class="text-bold" style="color:#2c5d8c;">Net profit</span>
          <span class="text-bold js-net-profit">${gbp(t.net)}</span>
        </div>
        <button class="btn-cta btn-full" onclick="go('mReceipts')">Continue to receipts</button>
      </div>
    </div>
  `;
}

function renderMReceipts() {
  const rows = state.receipts.map((name, i) => `
    <div class="flex-center gap-sm" style="padding:12px 16px; border-bottom:1px solid var(--color-border-light);">
      <div class="file-icon">📄</div>
      <div class="flex-1">
        <div class="text-bold">${name}</div>
        <div class="text-small text-muted">${Math.round((0.3 + i * 0.4) * 10) / 10} MB</div>
      </div>
      <a href="javascript:void(0)" class="link-danger" onclick="removeReceipt(${i})">Remove</a>
    </div>
  `).join('');

  return `
    <div>
      <div class="m-topbar">
        <a href="javascript:void(0)" class="link-primary" onclick="go('mFigures')">‹ Figures</a>
        <span class="text-bold">Receipts</span>
        <span style="width:56px;"></span>
      </div>
      <div class="m-pad-tight">
        <p class="text-muted mb-md">Add photos of receipts for this quarter (optional). We'll send them to your accountant.</p>
        <div class="dropzone mb-md" onclick="addReceipt()">
          <div class="dropzone-icon">📎</div>
          <div class="dropzone-title">Add from camera or photos</div>
          <div class="dropzone-sub">JPG, PNG or PDF</div>
        </div>
        ${state.receipts.length > 0 ? `<div class="m-card mb-md" style="padding:0;">${rows}</div>` : ''}
        <button class="btn-cta btn-full" onclick="submitMobile()">Submit to Riverside &amp; Co</button>
      </div>
    </div>
  `;
}

function renderMDone() {
  const t = totals();
  return `
    <div class="m-pad text-center">
      <div class="done-icon" style="width:88px; height:88px; font-size:34px;">✓</div>
      <h1 class="m-h1">Submitted</h1>
      <p class="text-muted mb-lg">Your ${PERIOD.short} figures are with Riverside &amp; Co. They'll prepare and file your quarterly update.</p>
      <div class="m-card" style="padding:0; text-align:left;">
        <div class="flex-between" style="padding:13px 16px; border-bottom:1px solid var(--color-border-light);"><span class="text-muted">Net profit</span><span class="text-bold">${gbp(t.net)}</span></div>
        <div class="flex-between" style="padding:13px 16px; border-bottom:1px solid var(--color-border-light);"><span class="text-muted">Receipts</span><span class="text-bold">${state.receipts.length}</span></div>
        <div class="flex-between" style="padding:13px 16px;"><span class="text-muted">Reference</span><span class="text-bold">MTD-Q1-2026-27</span></div>
      </div>
      <button class="btn-cta btn-full mt-lg" onclick="go('mRequests')">View my submissions</button>
    </div>
  `;
}

function renderMRequests() {
  const list = [
    { period: 'Q1 2026-27', sub: state.mSubmitted ? 'Submitted 31 Jul 2026' : 'Due 7 Aug 2026', label: state.mSubmitted ? 'Submitted' : 'Due', bg: state.mSubmitted ? '#e2f2e0' : '#fdf0dc', color: state.mSubmitted ? '#2a5d2c' : '#b0781a' },
    { period: 'Q4 2025-26', sub: 'Submitted 2 May 2026', label: 'Submitted', bg: '#e2f2e0', color: '#2a5d2c' },
    { period: 'Q3 2025-26', sub: 'Submitted 4 Feb 2026', label: 'Submitted', bg: '#e2f2e0', color: '#2a5d2c' },
  ];
  return `
    <div class="m-pad-tight">
      <h1 class="m-h1 text-center">Your MTD updates</h1>
      <div class="m-card" style="padding:0;">
        ${list.map(r => `
          <div class="flex-between" style="padding:15px 16px; border-bottom:1px solid var(--color-border-light);">
            <div><div class="text-bold" style="font-size:16px;">${r.period}</div><div class="text-small text-muted">${r.sub}</div></div>
            ${statusPill(r.label, r.bg, r.color)}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
