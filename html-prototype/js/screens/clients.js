/**
 * Screens 1-2: Practice dashboard client list (bulk-select to request MTD
 * data) and per-client settings (bridging mode + email preferences).
 */

const LEVEL_COLORS = {
  'on-track': ['#e2f2e0', '#3a8b3b'],
  attention: ['#fdf0dc', '#b0781a'],
  strained: ['#fbe4e4', '#c23b3b'],
};

const LEVEL_LABELS = {
  'on-track': 'On track',
  attention: 'Attention',
  strained: 'Strained',
};

function levelPill(level) {
  const [bg, color] = LEVEL_COLORS[level];
  return statusPill(LEVEL_LABELS[level], bg, color);
}

function renderClientList() {
  const visibleClients = state.groupFilter === 'bridging'
    ? CLIENTS.filter(c => c.bridgingMode)
    : CLIENTS;
  const groups = [...new Set(visibleClients.map(c => c.accountType))];
  const selectedCount = state.selectedClientIds.length;

  const inner = `
    <div class="main-content">
      <div class="flex-between mb-md">
        <div>
          <h1 class="page-title">Clients</h1>
          <p class="page-subtitle" style="margin-bottom:0;">${PRACTICE}</p>
        </div>
        <div class="flex gap-sm">
          <button class="btn-secondary btn-small">Manage groups</button>
          <button class="btn-cta btn-small">Add client ▾</button>
        </div>
      </div>

      <div class="callout-info">
        <span>📅</span>
        <div>
          <strong>Making Tax Digital</strong> · ${PERIOD.short} quarterly update · due 7 Aug 2026
          <div class="text-secondary text-small mt-sm">
            ${CLIENTS.length} updates due · ${CLIENTS.length - 1} awaiting data ·
            <a href="javascript:void(0)" class="link-primary" onclick="go('tracking')">1 ready to review →</a>
          </div>
        </div>
      </div>

      <div class="flex gap-sm mb-md">
        <select class="btn-outline">
          <option>All account managers</option>
        </select>
        <select class="btn-outline">
          <option>All client types</option>
        </select>
        <select class="btn-outline" onchange="setGroupFilter(this.value)">
          <option value="all" ${state.groupFilter === 'all' ? 'selected' : ''}>All clients</option>
          <option value="bridging" ${state.groupFilter === 'bridging' ? 'selected' : ''}>Bridging clients</option>
        </select>
        <input type="text" class="btn-outline flex-1" placeholder="Search clients" style="cursor:text;">
      </div>

      ${selectedCount > 0 ? `
        <div class="bulk-action-bar">
          <strong>${selectedCount} ${selectedCount === 1 ? 'client' : 'clients'} selected</strong>
          <button class="btn-cta btn-small" onclick="go('request')">📄 Request quarterly data</button>
          <a href="javascript:void(0)" class="link-muted" onclick="clearClientSelection()">Clear</a>
        </div>
      ` : ''}

      <table class="table">
        <thead>
          <tr>
            <th></th>
            <th>Name</th>
            <th>Account manager</th>
            <th>Bookkeeping</th>
            <th>Compliance</th>
            <th>Business health</th>
            <th class="text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          ${groups.map(group => `
            <tr class="table-group-row"><td colspan="7">${group}</td></tr>
            ${visibleClients.filter(c => c.accountType === group).map(c => `
              <tr>
                <td><input type="checkbox" ${state.selectedClientIds.includes(c.id) ? 'checked' : ''} onchange="toggleClientSelected('${c.id}')"></td>
                <td>
                  <div class="text-bold">${c.name} ${c.bridgingMode ? badge('Bridging', 'muted') : ''}</div>
                  <div class="text-small text-muted">${c.accountType}</div>
                </td>
                <td class="link-primary">${c.accountManager}</td>
                <td>${c.bookkeeping.count} · ${levelPill(c.bookkeeping.level)}</td>
                <td>${levelPill(c.compliance)}</td>
                <td>${levelPill(c.businessHealth)}</td>
                <td class="text-right"><button class="btn-outline btn-small" onclick="goToClientEdit('${c.id}')">View →</button></td>
              </tr>
            `).join('')}
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  return renderPracticeChrome(inner, false);
}

function renderClientEdit() {
  const client = CLIENTS.find(c => c.id === state.editingClientId) || CLIENTS[0];
  const emailRows = [
    { key: 'quarterlyReminders', title: 'Quarterly reminder emails', sub: 'Remind the client when a new quarterly update is due' },
    { key: 'chaseOverdue', title: 'Automatic overdue chase', sub: 'Send a follow-up if data has not arrived within 5 days' },
    { key: 'ccAccountManager', title: 'CC account manager', sub: `Copy ${client.accountManager} on all client communications` },
  ];

  const inner = `
    <div class="main-content">
      <a href="javascript:void(0)" class="link-muted" onclick="go('clientList')">‹ Back to clients</a>
      <h1 class="page-title mt-md">${client.name}</h1>
      <p class="page-subtitle">${client.accountType} · ${client.contact} · ${client.email}</p>

      <div class="section-label">MTD bridging</div>
      <div class="list-panel mb-lg">
        <div class="list-row list-row-between">
          <div>
            <div class="list-row-title">Bridging mode</div>
            <div class="list-row-sub">Post quarterly MTD figures via the bridging spreadsheet import, using the custom "bridging-*" categories instead of full bookkeeping</div>
          </div>
          <label class="flex" style="cursor:pointer;">
            <input type="checkbox" ${client.bridgingMode ? 'checked' : ''} onchange="toggleBridgingMode('${client.id}')">
          </label>
        </div>
      </div>

      ${client.bridgingMode ? `
        <div class="callout-info">
          <span>✅</span>
          <div>
            <strong>${client.name}</strong> has been added to the <strong>Bridging</strong> group and is now filterable from the Clients table.
            The MTD Bridging categories have been added to their account.
          </div>
        </div>
      ` : ''}

      <div class="section-label">Email communications</div>
      <div class="list-panel">
        ${emailRows.map(r => `
          <div class="list-row list-row-between">
            <div>
              <div class="list-row-title">${r.title}</div>
              <div class="list-row-sub">${r.sub}</div>
            </div>
            <label class="flex" style="cursor:pointer;">
              <input type="checkbox" ${client.emailSettings[r.key] ? 'checked' : ''} onchange="toggleEmailSetting('${client.id}', '${r.key}')">
            </label>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  return renderPracticeChrome(inner, true);
}
