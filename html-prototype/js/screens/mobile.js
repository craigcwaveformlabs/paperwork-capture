/**
 * Mobile app screens (all 6), rendered inside the phone-frame chrome.
 */

function renderMobile(screen) {
  let content = '';
  let showTabs = false;

  switch (screen) {
    case 'mDownload': content = renderMDownload(); break;
    case 'mSignin': content = renderMSignin(); break;
    case 'mHome': content = renderMHome(); showTabs = true; break;
    case 'mUpload': content = renderMUpload(); break;
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
      <p class="text-center text-muted mb-lg">Sign in to send your MTD paperwork</p>
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
      <p class="text-small text-muted text-center mt-md">Your accountant gave you a Level 2 login — you can send paperwork and see your requests.</p>
    </div>
  `;
}

function renderMHome() {
  const statusLabel = state.mSubmitted ? 'Submitted' : 'Action needed';
  return `
    <div class="m-pad-tight">
      <h1 class="m-h1 text-center">${FEATURED_CLIENT.name}</h1>
      <div class="m-card m-card-clickable" onclick="go('${state.mSubmitted ? 'mRequests' : 'mUpload'}')">
        <div class="flex-between">
          <div>
            <div class="m-card-title">Send your paperwork</div>
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

function renderMUpload() {
  const hasFiles = state.receipts.length > 0;
  const fileIcon = (name) => name.match(/statement/) ? '🏦' : name.match(/invoice/) ? '🧾' : '📄';

  const rows = state.receipts.map((name, i) => `
    <div class="flex-center gap-sm" style="padding:12px 16px; border-bottom:1px solid var(--color-border-light);">
      <div class="file-icon">${fileIcon(name)}</div>
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
        <a href="javascript:void(0)" class="link-primary" onclick="go('mHome')">‹ Home</a>
        <span class="text-bold">Send paperwork</span>
        <span style="width:44px;"></span>
      </div>
      <div class="text-center text-small text-muted mb-md">${PERIOD.short} · ${PERIOD.range}</div>
      <div class="m-pad-tight">
        <p class="text-muted mb-md">Add photos or files of your bank statements, receipts and invoices. Riverside &amp; Co will go through everything and work out your figures — no need to add anything up yourself.</p>
        <div class="dropzone ${hasFiles ? 'has-file' : 'needs-file'} mb-md" onclick="addReceipt()">
          <div class="dropzone-icon">📎</div>
          <div class="dropzone-title">Add from camera or photos</div>
          <div class="dropzone-sub">or choose a file · JPG, PNG or PDF</div>
        </div>
        ${hasFiles ? `<div class="m-card mb-md" style="padding:0;">${rows}</div>` : ''}
        ${!hasFiles ? `<p class="text-small text-warning text-center mb-md">Add at least one file to continue</p>` : ''}
        <button class="btn-cta btn-full" ${!hasFiles ? 'disabled' : ''} onclick="submitMobile()">Send to Riverside &amp; Co</button>
      </div>
    </div>
  `;
}

function renderMDone() {
  return `
    <div class="m-pad text-center">
      <div class="done-icon" style="width:88px; height:88px; font-size:34px;">✓</div>
      <h1 class="m-h1">Sent, thank you</h1>
      <p class="text-muted mb-lg">Riverside &amp; Co now have your paperwork for ${PERIOD.short}. They'll go through everything and work out your figures — nothing more for you to do right now.</p>
      <div class="m-card" style="padding:0; text-align:left;">
        <div class="flex-between" style="padding:13px 16px; border-bottom:1px solid var(--color-border-light);"><span class="text-muted">Files sent</span><span class="text-bold">${state.receipts.length}</span></div>
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
