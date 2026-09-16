/**
 * Screen 2: Client's mock inbox — the email notifying them a quarterly update is due.
 */

function renderEmail() {
  const inbox = [
    { from: 'Jim Jones', subject: `Your ${PERIOD.short} figures for HMRC`, snippet: 'It’s time for your Making Tax Digital update…', time: '10:24', unread: true, selected: true },
    { from: 'HMRC', subject: 'Making Tax Digital: Q1 update due soon', snippet: 'Your first quarterly update deadline is 7 Aug…', time: '09:02', unread: true, selected: false },
    { from: 'NatWest', subject: 'Your June statement is ready', snippet: 'You can now download your statement as a CSV…', time: 'Mon', unread: false, selected: false },
    { from: 'Wilson & Sons', subject: 'Remittance advice', snippet: 'Payment of £2,340.00 has been sent to your…', time: 'Sun', unread: false, selected: false },
  ];

  return `
    <div class="email-shell">
      <div class="email-list">
        <div class="email-list-header">
          <div class="email-list-title"><span class="email-logo">📧</span> Inbox <span class="badge-count">${inbox.length}</span></div>
          <div class="email-search">🔍 Search mail</div>
        </div>
        <div class="email-list-items">
          ${inbox.map(m => `
            <div class="email-item ${m.selected ? 'selected' : ''}">
              <div class="email-item-dot ${m.unread ? 'unread' : ''}"></div>
              <div class="flex-1">
                <div class="email-item-row">
                  <span class="email-item-from ${m.unread ? 'bold' : ''}">${m.from}</span>
                  <span class="email-item-time">${m.time}</span>
                </div>
                <div class="email-item-subject ${m.unread ? 'bold' : ''}">${m.subject}</div>
                <div class="email-item-snippet">${m.snippet}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="email-detail">
        <div class="email-detail-header">
          <h2>Your ${PERIOD.short} figures for HMRC</h2>
          <div class="email-sender-row">
            <div class="email-avatar">JJ</div>
            <div class="flex-1">
              <div class="email-sender-name">Jim Jones <span class="text-muted">· ${PRACTICE}</span></div>
              <div class="email-sender-to">to ${FEATURED_CLIENT.email}</div>
            </div>
            <span class="text-muted text-small">10:24 AM</span>
          </div>
        </div>
        <div class="email-detail-body">
          <p>Hi ${FEATURED_CLIENT.contact},</p>
          <p>It's time for your <strong>${PERIOD.range}</strong> Making Tax Digital update. Everything's done online — just open the secure link below, enter your income and expenses for the quarter, and add any receipts. No spreadsheet to fill in.</p>
          <div class="callout-info">
            <span>ⓘ</span>
            <div>This request was <strong>sent automatically</strong> a week after the quarter closed, in line with your MTD schedule. It's due by <strong>7 Aug 2026</strong>.</div>
          </div>
          <div class="email-cta-row">
            <button class="btn-cta btn-large" onclick="go('figures')">Open the MTD upload site →</button>
            <button class="btn-outline btn-large" onclick="go('mDownload')">📱 Submit via mobile app</button>
          </div>
          <p class="text-small text-muted" style="margin-top:18px;">The secure link signs you in automatically. Prefer your phone? Submit through the FreeAgent mobile app instead.</p>
        </div>
      </div>
    </div>
    ${renderProtoNav()}
  `;
}
