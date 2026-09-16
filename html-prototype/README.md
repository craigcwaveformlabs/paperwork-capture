# MTD Quarterly Capture — Hackdays HTML Prototype

A dependency-free recreation of the "MTD Quarterly Capture" concept (originally built on
a proprietary templating framework in `prototype/MTD Quarterly Capture.dc.html`), rebuilt
in plain HTML/CSS/JS so the team can freely hack on it during hackdays.

## Quick Start

Just open `index.html` directly in a browser — no server, no build step. Use the dark bar
fixed to the bottom of the screen ("MTD journey") to jump to any screen in the flow.

## Project Structure

```
html-prototype/
├── index.html            # loads styles.css, then every script below in order
├── styles.css            # design tokens + every component style
├── js/
│   ├── data.js            # static content: CLIENTS, INCOME, EXPENSES, MONTHS,
│   │                      # PRACTICE/PERIOD constants, formatters (gbp, gp, parseNum...)
│   ├── state.js           # single global `state` object + all derived getters/setters
│   │                      # (incVal/expAmt/totals/estimate/go/...)
│   ├── render.js          # rerender()/renderApp() router, input-patch helpers,
│   │                      # the prototype nav bar, and the 4 shared chrome wrappers
│   ├── screens/
│   │   ├── request.js     # accountant: request data from clients
│   │   ├── email.js       # client: mock inbox with the MTD update email
│   │   ├── figures.js     # client micro-site: figures entry + evidence upload
│   │   ├── tracking.js    # accountant: dashboard of sent requests
│   │   ├── bank.js        # accountant: bank account generated from the figures
│   │   ├── incometax.js   # accountant: cumulative MTD table + submit-to-HMRC modal
│   │   └── mobile.js      # all 7 mobile-app screens (phone frame)
│   └── app.js              # bootstrap — calls rerender() once everything's loaded
└── README.md
```

There's no bundler and no ES modules (`file://` blocks module `fetch` in Chrome, which
would break "just open index.html"). Every script is a plain `<script src="...">` tag
loaded in dependency order, all writing to shared global scope — `data.js` first, then
`state.js`, then `render.js`, then each screen, then `app.js` last.

## Key Concepts

### One shared data model
Editing an income/expense figure on the `figures` screen changes what shows up on `bank`
(transaction list) and `incometax` (cumulative table) — they all read from the same
`state.qedits`/`state.medits` overrides via `incVal()`/`expAmt()`/`expDis()` in `state.js`.

### Don't full-rerender() on every keystroke
The figures screens have live text inputs. A naive `rerender()` (full `innerHTML` replace)
on every keystroke would steal focus and reset the cursor position. Instead:

- Text inputs call `onQuarterFigureInput(key, value)` / `onMonthFigureInput(key, i, value)`
  on `oninput`, which update `state` and then call small "patch" functions
  (`patchFigureTotals()`, `patchRowQuarter()`) that update only specific output elements
  via `textContent` — tagged with `.js-total-income` / `.js-total-expenses` /
  `.js-net-profit` classes, or `data-row-quarter="{key}"` for month-view row subtotals.
- These patch functions never touch `<input>` elements, so the browser never re-creates
  them and focus/cursor position survive.
- A full `rerender()` is still used for navigation (`go(screen)`), toggling quarter/month
  view, and every other non-typing state change.

**If you add a new editable field, follow this pattern** — write to `state`, then patch
just the affected output element(s), don't call `rerender()`.

### Simulated uploads
There's no real file picker. Clicking a dropzone (`addReceipt()` / `addBankStatement()`
in `state.js`) appends a mock filename from a small rotating pool to `state.receipts` /
`state.bankStmts`, each with a "Remove" link. This keeps the demo self-contained.

### Four visual "chrome" wrappers
Each screen calls one of these (defined in `render.js`) to get its surrounding
header/nav/footer:
- `renderAcctChrome(inner, navHighlight)` — dark topbar + blue nav bar (bank, income tax)
- `renderPracticeChrome(inner, showDashboardLink)` — green practice header (request, tracking)
- `renderMicroChrome(inner)` + `renderStepIndicator(step)` — client-facing blue header,
  step indicator, dark footer (figures, receipts)
- `renderPhoneFrame(inner, showTabs)` — iOS-style phone frame with status bar and
  optional bottom tab bar (all mobile app screens)

`email.js` renders its own two-pane inbox layout directly, without a shared chrome.

## Common Tasks

**Change a client name / income line / expense line** — edit the arrays in `js/data.js`.
Everything downstream (figures form, bank transactions, income tax table) updates
automatically.

**Add a new screen** — add a `render<Name>()` function in a new or existing file under
`js/screens/`, add its script tag to `index.html`, add a case to the `renderApp()` switch
in `render.js`, and add an entry to `PROTO_NAV` in `render.js` so it's reachable from the
bottom nav bar.

**Change the primary/CTA colors** — edit `--color-primary` / `--color-cta` at the top of
`styles.css`.

## Debugging

Open DevTools (F12) — `console.log(state)` to inspect current state at any point.
