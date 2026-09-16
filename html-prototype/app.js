/**
 * Paperwork Capture - HTML Prototype
 * Easy-to-manipulate vanilla JS app for hackdays exploration
 */

// ============================================
// STATE MANAGEMENT
// ============================================

const state = {
  currentView: 'dashboard',
  selectedCompany: 'Riverside Studio Ltd',
  notifications: 3,
  selectedTab: 'transactions',
  data: {
    companies: [
      { id: 1, name: 'Riverside Studio Ltd', balance: '£24,500.00' },
      { id: 2, name: 'Tech Innovations Inc', balance: '£8,234.50' },
    ],
    transactions: [
      { date: '25 Jul', name: 'Client Payment', description: 'Invoice #1024', type: 'approved', in: '£5,000.00', out: '', balance: '£29,500.00' },
      { date: '24 Jul', name: 'Stripe Deposit', description: 'Sales deposit', type: 'expected', in: '£3,200.00', out: '', balance: '£24,500.00' },
      { date: '23 Jul', name: 'Monthly Rent', description: 'Office lease', type: 'unexpected', in: '', out: '£3,850.00', balance: '£21,300.00' },
      { date: '22 Jul', name: 'Software Subscription', description: 'Annual license', type: 'approved', in: '', out: '£450.00', balance: '£25,150.00' },
      { date: '21 Jul', name: 'Tax Payment', description: 'Quarterly VAT', type: 'approved', in: '', out: '£2,200.00', balance: '£25,600.00' },
    ],
    notifications: [
      { id: 1, message: 'Unexpected transaction detected: High value payment', severity: 'warning' },
      { id: 2, message: 'Tax deadline approaching', severity: 'info' },
      { id: 3, message: 'New reconciliation needed', severity: 'warning' },
    ]
  }
};

// ============================================
// COMPONENT FACTORY
// ============================================

/**
 * Simple HTML template strings with data interpolation
 * Usage: html`<div>${data.name}</div>`
 */
function html(strings, ...values) {
  let result = '';
  for (let i = 0; i < strings.length; i++) {
    result += strings[i] + (values[i] != null ? values[i] : '');
  }
  return result;
}

/**
 * Render component with event delegation
 */
function render(component, container) {
  container.innerHTML = component;
  attachEventListeners(container);
}

/**
 * Simple event delegation
 */
function attachEventListeners(container) {
  container.querySelectorAll('[data-action]').forEach(el => {
    const action = el.dataset.action;
    el.addEventListener('click', (e) => {
      e.preventDefault();
      handleAction(action, el.dataset);
    });
  });

  container.querySelectorAll('[data-tab]').forEach(el => {
    el.addEventListener('click', () => {
      state.selectedTab = el.dataset.tab;
      rerender();
    });
  });
}

/**
 * Handle user actions
 */
function handleAction(action, data) {
  const actions = {
    'return-dashboard': () => {
      state.currentView = 'dashboard';
      rerender();
    },
    'view-transactions': () => {
      state.currentView = 'transactions';
      rerender();
    },
    'view-reconciliation': () => {
      state.currentView = 'reconciliation';
      rerender();
    },
    'close-notification': (id) => {
      state.data.notifications = state.data.notifications.filter(n => n.id !== parseInt(id));
      rerender();
    },
  };

  const handler = actions[action];
  if (handler) {
    handler(data);
  }
}

// ============================================
// COMPONENTS
// ============================================

function Header() {
  return `
    <div class="header">
      <div>
        Hi, Jim. You are currently viewing <strong>${state.selectedCompany}</strong>
      </div>
      <button class="btn-secondary btn-small" data-action="return-dashboard">
        Return to dashboard
      </button>
    </div>
  `;
}

function NavBar() {
  const nav = [
    { label: 'Dashboard', active: state.currentView === 'dashboard' },
    { label: 'Banking', active: state.currentView === 'transactions' },
    { label: 'Reconciliation', active: state.currentView === 'reconciliation' },
    { label: 'Reports', active: false },
    { label: 'Settings', active: false },
  ];

  return `
    <div class="nav-bar">
      ${nav.map(item => `
        <div class="nav-item ${item.active ? 'active' : ''}" data-action="view-${item.label.toLowerCase()}">
          ${item.label}
        </div>
      `).join('')}
      <div class="nav-spacer"></div>
      <div class="nav-item">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.7 21a2 2 0 0 1-3.4 0"></path>
        </svg>
        <span style="position: relative; margin-left: 8px;">
          <span class="badge badge-warning" style="position: absolute; top: -8px; right: -12px; font-size: 10px;">
            ${state.notifications}
          </span>
        </span>
      </div>
      <div class="nav-item" style="padding-right: 0;">
        ${state.selectedCompany} ▾
      </div>
    </div>
  `;
}

function DashboardView() {
  return `
    <div class="main-content">
      <div class="card">
        <div class="card-title">Welcome back, Jim</div>
        <p>Select a company to get started or view recent activity below.</p>
      </div>

      <div class="card">
        <h3 class="mb-lg">Your Companies</h3>
        <div class="grid grid-2">
          ${state.data.companies.map(company => `
            <div style="padding: var(--spacing-lg); border: 1px solid var(--color-border); border-radius: var(--radius-lg);">
              <div class="text-bold mb-md">${company.name}</div>
              <div class="text-muted mb-lg">Balance: ${company.balance}</div>
              <button class="btn-primary btn-small" data-action="view-transactions">
                View Details
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function TransactionsView() {
  return `
    <div class="main-content">
      <div class="flex-between mb-lg">
        <div>
          <h1 class="card-title" style="margin: 0;">Business Current Account <span style="color: var(--color-text-tertiary);">▾</span></h1>
        </div>
        <div class="flex gap-md">
          <button class="btn-secondary btn-small">Export</button>
          <button class="btn-secondary btn-small">Filter</button>
          <button class="btn-primary btn-small">Reconcile</button>
        </div>
      </div>

      <div class="tabs mb-lg">
        <div class="tab ${state.selectedTab === 'transactions' ? 'active' : ''}" data-tab="transactions">
          Transactions
        </div>
        <div class="tab ${state.selectedTab === 'pending' ? 'active' : ''}" data-tab="pending">
          Pending
          <span class="badge badge-warning" style="margin-left: var(--spacing-sm);">2</span>
        </div>
        <div class="tab ${state.selectedTab === 'reconciled' ? 'active' : ''}" data-tab="reconciled">
          Reconciled
        </div>
      </div>

      <div class="mb-lg">
        <input type="text" placeholder="Search transactions..." style="width: 200px;">
      </div>

      <table class="table">
        <thead>
          <tr>
            <th style="width: 44px;"><input type="checkbox" checked></th>
            <th style="width: 108px;">Date ▲</th>
            <th>Description</th>
            <th style="width: 118px; text-align: right;">Money in</th>
            <th style="width: 118px; text-align: right;">Money out</th>
            <th style="width: 130px; text-align: right;">Balance</th>
          </tr>
        </thead>
        <tbody>
          ${state.data.transactions.map(tx => `
            <tr>
              <td><input type="checkbox"></td>
              <td class="text-small">${tx.date}</td>
              <td>
                <div class="flex-center gap-sm">
                  ${tx.type === 'unexpected' ? '<span style="width: 19px; height: 19px; border-radius: 50%; background: #fbe4e4; color: var(--color-error); font-weight: 800; font-size: 13px; display: flex; align-items: center; justify-content: center;">?</span>' : ''}
                  ${tx.type === 'expected' ? '<svg style="flex-shrink: 0;" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#e0891a" stroke-width="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"></path><circle cx="12" cy="12" r="3"></circle></svg>' : ''}
                  ${tx.type === 'approved' ? '<span style="width: 19px; height: 19px; border-radius: 50%; background: var(--color-success); opacity: 0.2; color: var(--color-success); font-weight: 800; font-size: 12px; display: flex; align-items: center; justify-content: center;">✓</span>' : ''}
                  <span class="text-bold">${tx.name}</span>
                </div>
                <div class="text-small text-muted">${tx.description}</div>
              </td>
              <td style="text-align: right; color: var(--color-text-primary);">${tx.in}</td>
              <td style="text-align: right; color: var(--color-text-secondary);">${tx.out}</td>
              <td style="text-align: right; color: var(--color-text-secondary);">${tx.balance}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function ReconciliationView() {
  return `
    <div class="main-content">
      <div class="card">
        <div class="card-title">Reconciliation</div>
        <p class="text-muted">Reconcile your bank transactions with your accounting records.</p>

        <div class="grid grid-2" style="margin-top: var(--spacing-lg);">
          <div>
            <div class="text-bold mb-md">Bank Balance</div>
            <div style="font-size: var(--font-size-2xl); color: var(--color-primary);">£29,500.00</div>
          </div>
          <div>
            <div class="text-bold mb-md">Accounting Balance</div>
            <div style="font-size: var(--font-size-2xl); color: var(--color-text-primary);">£28,950.00</div>
          </div>
        </div>

        <div style="margin-top: var(--spacing-lg); padding: var(--spacing-lg); background: #fff3cd; border-radius: var(--radius-md); border-left: 4px solid #e88a1a;">
          <div class="text-bold">Variance: £550.00</div>
          <p class="text-muted">Review transactions to identify the discrepancy.</p>
        </div>
      </div>
    </div>
  `;
}

function Layout() {
  let view;
  switch (state.currentView) {
    case 'dashboard':
      view = DashboardView();
      break;
    case 'transactions':
      view = TransactionsView();
      break;
    case 'reconciliation':
      view = ReconciliationView();
      break;
    default:
      view = DashboardView();
  }

  return `
    <div class="container">
      ${Header()}
      ${NavBar()}
      ${view}
    </div>
  `;
}

// ============================================
// RENDER & RERENDER
// ============================================

function rerender() {
  const app = document.getElementById('app');
  render(Layout(), app);
}

// Initial render
rerender();
