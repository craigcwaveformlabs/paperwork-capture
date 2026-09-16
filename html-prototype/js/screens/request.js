/**
 * Screen 1: Practice sends a quarterly data request to clients.
 */

function renderRequest() {
  const clients = state.selectedClientIds.length
    ? CLIENTS.filter(c => state.selectedClientIds.includes(c.id))
    : CLIENTS;
  const requestItems = [
    { icon: '📝', title: 'Quarterly income & expenses', sub: 'Entered on the MTD upload site — no spreadsheet needed' },
    { icon: '📎', title: 'Receipts (optional)', sub: 'Drag-and-drop photos or PDFs — sent to Files & Smart Capture' },
  ];
  const sendModes = [
    { key: 'auto', title: 'Automate to MTD schedule', sub: 'Send automatically one week after each quarter ends, every quarter' },
    { key: 'now', title: 'Send once, now', sub: `Email this request immediately for ${PERIOD.short} only` },
  ];
  const sendBtnLabel = (state.sendMode === 'auto' ? 'Schedule for ' : 'Send to ')
    + clients.length + ' ' + (clients.length === 1 ? 'client' : 'clients');

  const inner = `
    <div class="center-column">
      <div class="card-panel">
        <div class="card-panel-header">
          <div class="eyebrow">Making Tax Digital · Quarterly update</div>
          <div class="card-panel-title">Request quarterly data</div>
          <div class="card-panel-subtitle">${PERIOD.range} · ${clients.length} clients · self-employment</div>
        </div>

        <div class="card-panel-body">
          <div class="section-label">Clients will complete on the MTD upload site</div>
          <div class="list-panel">
            ${requestItems.map(i => `
              <div class="list-row">
                <div class="list-icon">${i.icon}</div>
                <div class="flex-1">
                  <div class="list-row-title">${i.title}</div>
                  <div class="list-row-sub">${i.sub}</div>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="section-label">Sending to</div>
          <div class="list-panel">
            ${clients.map(c => `
              <div class="list-row list-row-between">
                <div>
                  <div class="list-row-title">${c.name}</div>
                  <div class="list-row-sub">${c.contact} · ${c.email}</div>
                </div>
                ${statusPill(c.tag, '#e2f2e0', '#3a8b3b')}
              </div>
            `).join('')}
          </div>

          <div class="section-label">When to send</div>
          <div class="radio-list">
            ${sendModes.map(m => {
              const on = state.sendMode === m.key;
              return `
                <div class="radio-option ${on ? 'selected' : ''}" onclick="setSendMode('${m.key}')">
                  <span class="radio-dot-ring"><span class="radio-dot"></span></span>
                  <div>
                    <div class="radio-title">${m.title}</div>
                    <div class="radio-sub">${m.sub}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="card-panel-footer">
          <button class="btn-cta" onclick="go('email')">${sendBtnLabel}</button>
          <div class="flex-1"></div>
          <a href="javascript:void(0)" class="link-muted" onclick="go('tracking')">Cancel</a>
        </div>
      </div>
    </div>
  `;

  return renderPracticeChrome(inner, false);
}
