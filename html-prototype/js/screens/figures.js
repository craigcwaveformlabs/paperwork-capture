/**
 * Step 3 of the client-facing micro-site: choose how to get figures to the
 * practice, then follow one of two journeys — paper upload or MTD spreadsheet.
 * All three screens share the step indicator + submit-gating logic.
 */

function renderPathwayChoice() {
  const inner = `
    ${renderStepIndicator(1)}
    <div class="card-panel">
      <div class="card-panel-header">
        <div class="eyebrow">Making Tax Digital · Quarterly update</div>
        <h1 class="card-panel-title">How would you like to send your ${PERIOD.short} figures?</h1>
        <p class="card-panel-subtitle">${PRACTICE} have asked you to get your self-employment income and expenses to them for <strong>${PERIOD.range}</strong>. Pick whichever's easiest.</p>
      </div>

      <div class="card-panel-body">
        <div class="grid grid-2">
          <div class="choice-card" onclick="choosePathway('paper')">
            <div class="choice-card-icon">🗂️</div>
            <div class="choice-card-title">Just send us your paperwork</div>
            <div class="choice-card-sub">Upload bank statements, receipts and invoices as they are. ${PRACTICE.split(' ')[0]} will work out the figures for you.</div>
          </div>
          <div class="choice-card" onclick="choosePathway('spreadsheet')">
            <div class="choice-card-icon">📊</div>
            <div class="choice-card-title">Use our MTD spreadsheet</div>
            <div class="choice-card-sub">Download our template, fill in your figures, and upload it back — we'll pull the numbers straight into your ledger.</div>
          </div>
        </div>
      </div>
    </div>
  `;

  return renderMicroChrome(inner);
}

function renderPaperUpload() {
  if (state.paperSent) {
    return renderMicroChrome(renderPaperUploadDone());
  }

  const hasFiles = state.shoeboxFiles.length > 0;

  const fileIcon = (name) => name.match(/statement/) ? '🏦' : name.match(/invoice/) ? '🧾' : '📄';

  const fileRows = state.shoeboxFiles.map((name, i) => `
    <div class="file-row file-row-success">
      <div class="file-icon">${fileIcon(name)}</div>
      <div class="flex-1">
        <div class="file-name">${name}</div>
        <div class="file-meta">${Math.round((0.3 + i * 0.4) * 10) / 10} MB · will be saved to Files</div>
      </div>
      <a href="javascript:void(0)" class="link-danger" onclick="removeShoeboxFile(${i})">Remove</a>
    </div>
  `).join('');

  const inner = `
    ${renderStepIndicator(2)}
    <div class="card-panel">
      <div class="card-panel-header">
        <h1 class="card-panel-title">Upload your paperwork for ${PERIOD.short}</h1>
        <p class="card-panel-subtitle">Drop in everything you've got for ${PERIOD.range} — bank statements, receipts, sales invoices, purchase invoices. ${PRACTICE} will go through it and match it to your ledger. No need to sort or total anything up.</p>
      </div>

      <div class="card-panel-body">
        <div class="upload-section-title">
          <span>Your paperwork</span>
          ${badge('Required', 'error')}
        </div>
        <p class="text-small text-muted">Bank statements, receipts, sales invoices, purchase invoices — whatever you have.</p>
        <div class="dropzone ${hasFiles ? 'has-file' : 'needs-file'}" onclick="addShoeboxFile()">
          <div class="dropzone-icon">🗂️</div>
          <div class="dropzone-title">Drag &amp; drop your paperwork here</div>
          <div class="dropzone-sub">or click to browse · PDF, image or Word doc · max 20MB each</div>
        </div>
        ${hasFiles ? `
          <div class="mt-md">
            <div class="text-small text-bold text-secondary mb-sm">${state.shoeboxFiles.length} added — these go to Files for ${PRACTICE.split(' ')[0]} to process</div>
            <div class="file-list">${fileRows}</div>
          </div>
        ` : ''}
      </div>

      <div class="card-panel-footer">
        <a href="javascript:void(0)" class="link-muted text-bold" onclick="go('figures')">‹ Choose a different way</a>
        <div class="flex-1"></div>
        ${!hasFiles ? `<span class="text-warning text-small">Add at least one file to continue</span>` : ''}
        <button class="btn-cta btn-large" ${!hasFiles ? 'disabled' : ''} onclick="sendShoebox()">Send to ${PRACTICE.split(' ')[0]} &amp; Co</button>
      </div>
    </div>
  `;

  return renderMicroChrome(inner);
}

function renderPaperUploadDone() {
  const count = state.shoeboxFiles.length;

  return `
    <div class="card-panel done-card">
      <div class="done-icon">✓</div>
      <h1>Sent, thank you ${FEATURED_CLIENT.contact}</h1>
      <p class="done-sub">${PRACTICE} now have your paperwork for ${PERIOD.short}. They'll go through everything, work out your figures, and match each item to your ledger — nothing more for you to do right now.</p>

      <div class="callout-info done-callout">
        <span>📁</span>
        <div>Everything you uploaded has been saved to <strong>Files</strong> on the FreeAgent account, filed against ${PERIOD.short}, ready for ${PRACTICE} to work through.</div>
      </div>

      <div class="summary-panel">
        <div class="summary-row" style="border-bottom:none;"><span>Files uploaded</span><span class="text-bold">${count} ${count === 1 ? 'file' : 'files'}</span></div>
      </div>

      <button class="btn-cta btn-large mt-lg" onclick="go('tracking')">See it land in the practice ›</button>
    </div>
  `;
}

function renderMtdSpreadsheet() {
  if (state.mtdSent) {
    return renderMicroChrome(renderMtdSpreadsheetDone());
  }

  const hasSheet = !!state.mtdFile;

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
        <h1 class="card-panel-title">Complete the MTD spreadsheet for ${PERIOD.short}</h1>
        <p class="card-panel-subtitle">Download our template, fill in your income and expenses for ${PERIOD.range}, then upload it back here. We'll extract the figures and post them straight into your ledger.</p>
      </div>

      <div class="card-panel-body">
        <div class="upload-section-title"><span>1. Download the template</span></div>
        <div class="callout-info">
          <span>📥</span>
          <div>
            <div class="text-bold">MTD spreadsheet — ${PERIOD.short}</div>
            <div class="text-small text-secondary">Pre-formatted for your self-employment income and expenses. Fill it in offline, then come back and upload it below.</div>
          </div>
          <div class="flex-1"></div>
          <a class="btn-secondary btn-small" href="assets/mtd-spreadsheet-template.xlsx" download>Download</a>
        </div>

        <div class="divider"></div>

        <div class="upload-section-title">
          <span>2. Upload your completed spreadsheet</span>
          ${badge('Required', 'error')}
        </div>
        <p class="text-small text-muted">The filled-in template, exported as .xlsx or .csv.</p>
        ${!hasSheet ? `
          <div class="dropzone needs-file" onclick="uploadMtdSheet()">
            <div class="dropzone-icon">📊</div>
            <div class="dropzone-title">Drag &amp; drop your completed spreadsheet</div>
            <div class="dropzone-sub">or click to browse · XLSX or CSV · max 20MB</div>
          </div>
        ` : `
          <div class="file-list">
            <div class="file-row file-row-success">
              <div class="file-icon">✓</div>
              <div class="flex-1">
                <div class="file-name">${state.mtdFile}</div>
                <div class="file-meta">0.4 MB · will be processed into your ledger</div>
              </div>
              <a href="javascript:void(0)" class="link-danger" onclick="removeMtdSheet()">Remove</a>
            </div>
          </div>
        `}

        <div class="divider"></div>

        <div class="upload-section-title">
          <span>3. Supporting evidence</span>
          ${badge('Optional', 'muted')}
        </div>
        <p class="text-small text-muted">Photos or PDFs of receipts for the quarter. We'll read them with Smart Capture and match them to your figures.</p>
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
        <a href="javascript:void(0)" class="link-muted text-bold" onclick="go('figures')">‹ Choose a different way</a>
        <div class="flex-1"></div>
        ${!hasSheet ? `<span class="text-warning text-small">Upload your completed spreadsheet to continue</span>` : ''}
        <button class="btn-cta btn-large" ${!hasSheet ? 'disabled' : ''} onclick="sendMtdSheet()">Send to ${PRACTICE.split(' ')[0]} &amp; Co</button>
      </div>
    </div>
  `;

  return renderMicroChrome(inner);
}

function renderMtdSpreadsheetDone() {
  const receiptCount = state.receipts.length;
  const evidenceSuffix = receiptCount > 0 ? ` and ${receiptCount} supporting ${receiptCount === 1 ? 'receipt' : 'receipts'}` : '';

  return `
    <div class="card-panel done-card">
      <div class="done-icon">✓</div>
      <h1>Sent, thank you ${FEATURED_CLIENT.contact}</h1>
      <p class="done-sub">${PRACTICE} now have your ${PERIOD.short} spreadsheet${evidenceSuffix}. We'll extract the figures from it and post the ledger events straight into FreeAgent — nothing more for you to do.</p>

      <div class="callout-info done-callout">
        <span>📁</span>
        <div>Your spreadsheet has been saved to <strong>Files</strong> on the FreeAgent account, filed against ${PERIOD.short}, ready to be processed.</div>
      </div>

      <div class="summary-panel">
        <div class="summary-row"><span>Spreadsheet received</span><span class="text-bold">${state.mtdFile}</span></div>
        <div class="summary-row" style="border-bottom:none;"><span>Supporting evidence attached</span><span class="text-bold">${receiptCount}</span></div>
      </div>

      <button class="btn-cta btn-large mt-lg" onclick="go('tracking')">See it land in the practice ›</button>
    </div>
  `;
}
