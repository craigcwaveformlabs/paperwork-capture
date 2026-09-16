/**
 * Screen 5: Practice dashboard — status of every paperwork request sent to clients.
 */

function renderTracking() {
  const requests = [
    { client: FEATURED_CLIENT.name, ref: 'MTD-Q1-2026-27', sent: '6 Jul 2026', due: '7 Aug 2026', status: 'Data received', variant: 'received', actLabel: 'Open account', action: "go('bank')" },
    { client: 'Oakfield Joinery', ref: 'MTD-Q1-2026-27', sent: '6 Jul 2026', due: '7 Aug 2026', status: 'Awaiting client', variant: 'awaiting', actLabel: 'Chase', action: '' },
    { client: 'Copper & Reed Design', ref: 'MTD-Q1-2026-27', sent: '6 Jul 2026', due: '7 Aug 2026', status: 'Loaded', variant: 'loaded', actLabel: 'View', action: "go('bank')" },
  ];
  const variantColors = {
    received: ['#e6eff8', '#2c6ca8'],
    loaded: ['#e2f2e0', '#3a8b3b'],
    awaiting: ['#fdf0dc', '#b0781a'],
  };
  const stats = [
    { n: 3, label: 'Requests sent', color: '#1a2530' },
    { n: 1, label: 'Data received', color: '#2c6ca8' },
    { n: 1, label: 'Loaded', color: '#3a8b3b' },
    { n: 1, label: 'Awaiting client', color: '#b0781a' },
  ];

  const inner = `
    <div class="main-content">
      <h1 class="page-title">Paperwork requests</h1>
      <p class="page-subtitle">MTD quarterly updates · ${PERIOD.short} · self-employment</p>

      <div class="stats-grid">
        ${stats.map(s => `
          <div class="stat-card">
            <div class="stat-number" style="color:${s.color};">${s.n}</div>
            <div class="stat-label">${s.label}</div>
          </div>
        `).join('')}
      </div>

      <table class="table">
        <thead>
          <tr><th>Client</th><th>Sent</th><th>Due</th><th>Status</th><th class="text-right">Action</th></tr>
        </thead>
        <tbody>
          ${requests.map(r => {
            const [bg, color] = variantColors[r.variant];
            const primary = r.variant === 'received';
            return `
              <tr>
                <td><div class="text-bold">${r.client}</div><div class="text-small text-muted">${r.ref}</div></td>
                <td class="text-secondary">${r.sent}</td>
                <td class="text-secondary">${r.due}</td>
                <td>${statusPill(r.status, bg, color)}</td>
                <td class="text-right"><button class="btn-small ${primary ? 'btn-cta' : 'btn-secondary'}" onclick="${r.action}">${r.actLabel}</button></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  return renderPracticeChrome(inner, true);
}
