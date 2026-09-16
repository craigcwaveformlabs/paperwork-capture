/**
 * Core render loop + shared chrome/components used by every screen.
 *
 * Screen files (js/screens/*.js) each expose a `render<Screen>()` function
 * that returns an HTML string. `renderApp()` below picks the right one based
 * on `state.screen`. Screens call the chrome wrappers here to get the
 * surrounding header/nav/footer for their flavour of the app.
 */

function rerender() {
  document.getElementById('app').innerHTML = renderApp();
}

function renderApp() {
  switch (state.screen) {
    case 'clientList': return renderClientList();
    case 'clientEdit': return renderClientEdit();
    case 'request': return renderRequest();
    case 'email': return renderEmail();
    case 'figures': return renderPathwayChoice();
    case 'paper': return renderPaperUpload();
    case 'mtdSheet': return renderMtdSpreadsheet();
    case 'tracking': return renderTracking();
    case 'bank': return renderBank();
    case 'incometax': return renderIncomeTax();
    case 'mDownload':
    case 'mSignin':
    case 'mHome':
    case 'mFigures':
    case 'mReceipts':
    case 'mDone':
    case 'mRequests':
      return renderMobile(state.screen);
    default: return renderClientList();
  }
}

// ============================================
// EDITABLE FIGURES — targeted DOM patches
// ============================================
// These screens have live text inputs. A full rerender() on every keystroke
// would steal focus/cursor position, so input handlers only touch state +
// patch the specific derived output elements below (tagged with a shared
// class/data-attribute), and never touch the <input> elements themselves.

function patchFigureTotals() {
  const t = totals();
  document.querySelectorAll('.js-total-income').forEach(el => { el.textContent = gbp(t.ti); });
  document.querySelectorAll('.js-total-expenses').forEach(el => { el.textContent = gbp(t.te); });
  document.querySelectorAll('.js-net-profit').forEach(el => { el.textContent = gbp(t.net); });
}

function patchRowQuarter(key) {
  const def = INCOME.find(x => x.key === key) || EXPENSES.find(x => x.key === key);
  const q = [0, 1, 2].reduce((s, i) => s + mVal(key, i, def.amt), 0);
  document.querySelectorAll(`[data-row-quarter="${key}"]`).forEach(el => { el.textContent = gp(q); });
}

function onQuarterFigureInput(key, value) {
  setQ(key, value);
  patchFigureTotals();
}

function onMonthFigureInput(key, i, value) {
  setM(key, i, value);
  patchRowQuarter(key);
  patchFigureTotals();
}

// ============================================
// PROTOTYPE NAV — jump to any step of the journey
// ============================================

const PROTO_NAV = [
  ['clientList', '1 · Clients'],
  ['clientEdit', '2 · Client settings'],
  ['request', '3 · Request'],
  ['email', '4 · Email'],
  ['figures', '5 · Site: choose path'],
  ['paper', '5a · Site: paper upload'],
  ['mtdSheet', '5b · Site: MTD spreadsheet'],
  ['tracking', '6 · Requests'],
  ['bank', '7 · Bank account'],
  ['incometax', '8 · Income Tax'],
  ['mDownload', 'App · Download'],
  ['mSignin', 'App · Sign in'],
  ['mHome', 'App · Home'],
  ['mFigures', 'App · Figures'],
  ['mReceipts', 'App · Receipts'],
  ['mRequests', 'App · Submissions'],
];

function renderProtoNav() {
  return `
    <div class="proto-nav">
      <span class="proto-nav-label">MTD journey</span>
      ${PROTO_NAV.map(([key, label]) => {
        const on = key === state.screen;
        const mobile = key[0] === 'm';
        const cls = ['proto-nav-btn', on ? 'active' : '', (!on && mobile) ? 'mobile' : ''].filter(Boolean).join(' ');
        return `<button class="${cls}" onclick="go('${key}')">${label}</button>`;
      }).join('')}
    </div>
  `;
}

// ============================================
// SHARED UI BITS
// ============================================

function badge(text, variant) {
  return `<span class="badge badge-${variant}">${text}</span>`;
}

function statusPill(label, bg, color) {
  return `<span class="status-pill" style="background:${bg}; color:${color};">${label}</span>`;
}

// ============================================
// CHROME — accountant (bank / income tax)
// ============================================

function renderAcctChrome(inner, navHighlight) {
  const navItems = ['Overview', 'Contacts', 'Work ▾', 'Bills', 'My Money ▾', 'Banking ▾', 'Taxes ▾', 'Accounting ▾'];
  return `
    <div class="acct-shell">
      <div class="acct-topbar">
        <div>Hi, Jim. You are currently viewing the <strong>${FEATURED_CLIENT.name} - Sole Trader</strong> account.</div>
        <button class="btn-secondary btn-small" onclick="go('clientList')">Return to your dashboard</button>
      </div>
      <div class="acct-nav">
        ${navItems.map(label => `<div class="acct-nav-item ${label === navHighlight ? 'active' : ''}">${label}</div>`).join('')}
        <div class="nav-spacer"></div>
        <div class="acct-nav-icon" title="Search">🔍</div>
        <div class="acct-nav-icon" title="Notifications" style="position:relative;">🔔<span class="acct-bell">${state.submitted ? 2 : 3}</span></div>
        <div class="acct-nav-item">${FEATURED_CLIENT.name} ▾</div>
      </div>
      ${inner}
    </div>
    ${renderProtoNav()}
  `;
}

// ============================================
// CHROME — practice dashboard (request / tracking)
// ============================================

function renderPracticeChrome(inner, showDashboardLink) {
  return `
    <div class="practice-shell">
      <div class="practice-topbar">
        <span class="practice-brand">FreeAgent <span class="practice-brand-sub">Practice Dashboard</span></span>
        ${showDashboardLink ? `<button class="btn-secondary btn-small" onclick="go('clientList')">Your dashboard</button>` : ''}
      </div>
      ${inner}
    </div>
    ${renderProtoNav()}
  `;
}

// ============================================
// CHROME — client micro-site (figures / receipts)
// ============================================

function renderMicroChrome(inner) {
  return `
    <div class="micro-shell">
      <div class="micro-topbar">
        <div class="micro-brand">
          <span class="micro-brand-name">FreeAgent</span>
          <span class="micro-brand-divider"></span>
          <span class="micro-brand-sub">MTD upload</span>
        </div>
        ${state.authed ? `
          <div class="micro-identity">
            <span class="micro-avatar">${FEATURED_CLIENT.initials}</span>
            <span>${FEATURED_CLIENT.contact}</span>
          </div>
        ` : ''}
      </div>
      <div class="micro-body">
        <div class="micro-body-inner">
          ${inner}
        </div>
      </div>
      <div class="micro-footer">
        <span class="micro-brand-name">FreeAgent</span>
        <div class="micro-footer-links">
          <span>Privacy Notice</span>
          <span>Terms of Service</span>
          <span>Support</span>
        </div>
      </div>
    </div>
    ${renderProtoNav()}
  `;
}

function renderStepIndicator(activeStep) {
  const stepTwoText = state.pathway === 'spreadsheet' ? 'Spreadsheet' : 'Evidence';
  const steps = [
    { n: 1, text: 'Choose a way' },
    { n: 2, text: stepTwoText },
  ];
  return `
    <div class="step-indicator">
      ${steps.map(s => {
        const done = s.n < activeStep;
        const active = s.n === activeStep;
        const cls = done ? 'done' : (active ? 'active' : 'idle');
        return `
          <div class="step ${cls}">
            <span class="step-dot">${done ? '✓' : s.n}</span>
            <span class="step-text">${s.text}</span>
          </div>
          <span class="step-connector"></span>
        `;
      }).join('')}
      <span class="step-text idle">Send</span>
    </div>
  `;
}

// ============================================
// CHROME — mobile app (phone frame)
// ============================================

function renderPhoneFrame(inner, showTabs) {
  return `
    <div class="phone-backdrop">
      <div class="phone-frame">
        <div class="phone-statusbar">
          <span>11:19</span>
          <span>📶 🔋</span>
        </div>
        <div class="phone-content">${inner}</div>
        ${showTabs ? `
          <div class="phone-tabbar-wrap">
            <div class="phone-tabbar">
              <div class="phone-tab active">Money Out</div>
              <div class="phone-tab">Money In</div>
              <div class="phone-tab">Menu</div>
            </div>
          </div>
        ` : ''}
        <div class="phone-home-indicator"><span></span></div>
      </div>
    </div>
    ${renderProtoNav()}
  `;
}
