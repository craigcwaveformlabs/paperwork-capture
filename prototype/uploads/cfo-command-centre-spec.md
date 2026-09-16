# Build spec — CFO Command Centre (the `Overview` screen)

**For:** Claude Design, extending the existing **blue FreeAgent owner app** (the same application shell the *Paperwork Capture* prototype lives in).
**What this is:** the business owner's home screen — a single-business "CFO command centre" built around a **Business Health score**, splitting the world into **Today** (act now) and **Tomorrow** (see ahead). It is the owner-side counterpart to the green practice dashboard's per-client health view.

---

## 0. Context & intent (why this screen exists)

The product thesis is *connected finance*: one system that holds the account, the books, tax and funding together, and therefore can act and see ahead in ways a bank or an accounting tool couldn't alone. This screen is that thesis made real for the **business owner**.

- The **accountant** already has a practice-wide dashboard where each client shows a health score built from **bookkeeping-hygiene** signals (unexplained transactions, feeds, reconciliation…). That's the "are these books clean?" lens.
- This new screen is the **owner's** lens: *"is my business OK — am I getting paid, can I cover what's coming, am I ready for tax, am I growing?"* Same scoring **engine** (weighted 0–100, user-adjustable weights, sub-scores, coloured bands), different **drivers** (business outcomes, not bookkeeping hygiene).
- The two are the **same business seen from both sides** — the owner's command centre is, to the accountant, one row in their portfolio. Keep that mental model; a later task will wire the cross-link.

Design principle carried from the marketing site: **promise first, mechanism as proof.** Lead each module with what it means for the owner ("You'll be £4,200 short on the 30th"), let the connected mechanism be the supporting detail ("built from your invoices, bills, tax and funding").

---

## 1. Where it sits in the app

- This is the **`Overview`** item in the blue app's primary navigation — the default landing screen when an owner logs in.
- **Reuse the existing blue FreeAgent chrome exactly** — same top nav, colours, type, spacing, logo lockup, account switcher as the Paperwork Capture prototype. Do **not** restyle the shell. This screen is new *content* inside the existing *frame*.
- Primary nav (confirm against existing app; likely): Overview (this, active) · Work / Invoicing · Banking · Bills · Payroll · Taxes · Reports · (Accountant). Keep whatever the existing app already has; just make Overview the active tab.

---

## 2. Screen layout (top to bottom)

A single scrolling screen, max-width ~1240px, generous whitespace, the established card style (white, 1px border `#e2e7f0`, radius 14px, ~22–24px padding) from the green dashboard so the family reads as one product.

```
┌─────────────────────────────────────────────────────────────┐
│  [blue app top nav — existing chrome]                        │
├─────────────────────────────────────────────────────────────┤
│  Greeting row:  "Good morning, Priya"      [date]  [period ▾]│
│                                                               │
│  ┌── HERO: Business Health ───────────────────────────────┐  │
│  │  [ gauge 0–100 ]   Health drivers breakdown (5 bars)   │  │
│  │      78            + one-line "what's pulling it"       │  │
│  │   "Healthy"        [ Adjust what counts ▾ ]            │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌── TODAY ────────────────┐  ┌── TOMORROW ──────────────┐   │
│  │  Act now (4)            │  │  See ahead               │   │
│  │  • Chase 3 overdue inv  │  │  • 90-day cashflow (chart)│  │
│  │  • Approve bill run     │  │  • Tax forecast           │   │
│  │  • Run payroll (Fri)    │  │  • Benchmark vs peers     │   │
│  │  • VAT due in 9 days    │  │  • Year-end readiness     │   │
│  └─────────────────────────┘  └──────────────────────────┘   │
│                                                               │
│  ┌── Connected / "what's feeding this" strip (optional) ──┐  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. The hero: Business Health score

### 3.1 The gauge
- A large **semi-circle gauge, 0–100** (reuse the green dashboard's gauge component/`gaugeDash` style so it's visually identical to the per-client gauges there).
- Big number in the centre (e.g. **78**), band label beneath (**Healthy / Watch / Strained / At risk**).
- **Bands & colours** (reuse existing): ≥80 healthy `#1f8a3b`; 60–79 watch/amber `#b0781a`; 40–59 strained; <40 attention/red `#c23b3b`. (Match the exact thresholds/colours already in the green app's `bandColor`.)

### 3.2 Driver breakdown (the point of view)
To the right of the gauge, the score decomposes into **five owner-meaningful drivers**, each a labelled horizontal bar (0–100) with its own mini score and colour band, plus a one-line plain-English signal. This is what makes the score credible — you can see *what's pulling it up or down*.

| Driver | What it measures (owner language) | Example sub-signal | Maps to (daisy) |
|---|---|---|---|
| **Getting paid** | Are customers paying on time? | "2 invoices overdue · £4.2k · debtor days 41" | Get paid |
| **Cashflow** | Is there runway; any shortfall ahead? | "Tight — projected −£549 on 1 Jan" | Control |
| **Tax readiness** | Is enough set aside for what's owed? | "£9.1k set aside · covers 78% of Jan bill" | Tax |
| **Profitability** | Margin and trend | "Net margin 18% · up 3pts on last quarter" | (books) |
| **Growth & funding** | Headroom and standing vs peers | "Above peer average · £15k facility unused" | Grow/Fund |

- Each driver bar is **clickable** → deep-links to the relevant part of the app (Getting paid → invoicing/AR; Cashflow → the projection; Tax → Taxes; etc.). For the first build, wiring can be stubbed (button present, links to the section or a placeholder).
- **"Adjust what counts ▾"** — reuse the green dashboard's **weight-editor pattern** (`setWeight`/`resetWeights`): a panel where the owner drags weights for the five drivers, and the headline score recomputes live. This is a signature interaction — carry it over faithfully. Default weights (starting point, tune to taste): Getting paid 25 · Cashflow 25 · Tax readiness 20 · Profitability 15 · Growth & funding 15.

### 3.3 Score model (calculation)
Mirror the existing engine exactly — **weighted average of driver sub-scores**, each sub-score 0–100 as a deduction-from-100 curve driven by seeded per-business data:

```
score = round( Σ(weight_i × subScore_i) / Σ(weight_i) )
```

Suggested sub-score curves (owner drivers; tune later — keep them legible):
- **Getting paid:** start 100; −8 per overdue invoice; −1 per debtor-day over 30 (floor 0).
- **Cashflow:** 100 if no projected shortfall in 90d; scale down toward ~30 as the size/imminence of a projected shortfall grows (e.g. shortfall within 30d and >5% of monthly outgoings → ~40).
- **Tax readiness:** = clamp( setAside / upcomingLiability × 100 ). 100 if fully provisioned; red if <40%.
- **Profitability:** band from net margin (e.g. ≥15% →100, 10–15% →80, 5–10% →60, 0–5% →40, loss →15), nudged by trend.
- **Growth & funding:** blend of benchmark percentile vs peers and unused-facility headroom.

Keep all demo data **deterministic/seeded** (same discipline as the existing prototypes) so numbers are stable across sessions.

---

## 4. TODAY — "Act now" column

The left column below the hero. This is the **connected-data-enables-action** half. A titled card, "Today · act now (N)", containing a vertical list of **action rows**, each: an icon, a one-line plain-English description with the key number bolded, a right-aligned **primary action button**, and a subtle severity accent (red/amber) on the left edge for urgency.

Seed these four (map to real app destinations where they exist):
1. **Chase overdue invoices** — "3 invoices overdue · £4,200 · oldest 21 days" → **Chase all** (this can reuse/echo the Smart Collect chase concept, but for *sales* invoices). 
2. **Approve the bill run** — "5 bills due this week · £6,120" → **Review & pay**.
3. **Run payroll** — "Due Friday · 6 staff · £11,420 · PAYE £3,180 set aside" → **Run payroll**.
4. **VAT payment coming** — "£5,260 due in 9 days · covered by tax pot" → **Review VAT**.

Behaviour: each row's button deep-links into the relevant existing section (stub acceptable in v1). When an action is completed it should visibly drop off the list (echo the green app's "auto-drop when resolved" mechanic and the Smart Collect Collection pattern). Show an empty-state ("All clear for today ✓") when none remain.

---

## 5. TOMORROW — "See ahead" column

The right column. This is the **connected-data-enables-foresight** half — the marketing site's before/connected forecast, now live in-product. A titled card, "Tomorrow · see ahead", containing:

### 5.1 90-day cashflow projection (the centrepiece)
- A **forward line chart**: solid line for actuals to date, **dashed** for the forward projection, a **zero line**, and a marker where it dips negative. Headline: **"Projected £549 short on 1 Jan"** with a small "in time to act" reassurance.
- Below the chart, a compact **"what's driving it"** list — each input **source-tagged** to show the connection doing the work (this is lifted directly from the marketing site's connected panel and it's the strongest bit):
  - Invoices due `Your invoices` +£12,300
  - Bills & payroll `Your bills` −£15,760
  - VAT due 22nd `Tax` −£5,260
  - Loan repayment `Funding` −£1,400
- A **"See full forecast →"** link (stub in v1).
- NB on voice: source tags read as reassurance ("we're using everything you've got"), not plumbing. Keep them small and secondary.

### 5.2 Two supporting tiles (below the chart, side by side)
- **Benchmark vs peers** — "Your net margin 18% vs 12% for design studios your size · top 30%." A small bar or percentile marker.
- **Year-end readiness** — "Books 92% ready for year-end · 4 items to tidy" with a mini progress ring → **Get ready** (stub).

---

## 6. Optional bottom strip — "What's connected"

A quiet full-width strip echoing the daisy: small labelled chips for the connected sources feeding the command centre (Account · Invoicing · Bills · Payroll · Tax · Cards · Funding), with a subtle "all connected" affordance. Low priority — include only if it doesn't crowd the screen. Its job is to reinforce *why* the command centre can see what it sees.

---

## 7. Data model (seed one business: "Rowan & Field")

Use the same protagonist as the marketing site for continuity — **Rowan & Field**, an Edinburgh design studio, ~£480k revenue, team of 8. Seed object shape (extend as needed):

```js
const biz = {
  name: 'Rowan & Field', owner: 'Priya', type: 'Limited company', vat: 'Flat Rate',
  health: { /* computed */ },
  gettingPaid: { overdueCount: 3, overdueValue: 4200, oldestDays: 21, debtorDays: 41 },
  cashflow: { balance: 12480, projShortfall: -549, shortfallDate: '1 Jan',
              inputs: [ {label:'Invoices due', src:'Your invoices', v:12300},
                        {label:'Bills & payroll', src:'Your bills', v:-15760},
                        {label:'VAT due 22nd', src:'Tax', v:-5260},
                        {label:'Loan repayment', src:'Funding', v:-1400} ] },
  tax: { setAside: 9140, upcomingLiability: 11700, nextDue: 'VAT · 9 days' },
  profit: { netMargin: 0.18, trendPts: +3, rev12m: 480000 },
  growth: { benchPercentile: 70, peerMargin: 0.12, facilityUnused: 15000 },
  today: [
    {id:'ar', sev:'high', text:'3 invoices overdue · £4,200 · oldest 21 days', action:'Chase all'},
    {id:'bills', sev:'med', text:'5 bills due this week · £6,120', action:'Review & pay'},
    {id:'pay', sev:'med', text:'Payroll due Friday · 6 staff · £11,420', action:'Run payroll'},
    {id:'vat', sev:'low', text:'VAT £5,260 due in 9 days · covered', action:'Review VAT'},
  ],
};
```

Keep values consistent with the marketing site's Rowan & Field numbers where they overlap (the −£549 on 1 Jan shortfall especially — it's the signature moment).

---

## 8. Visual & interaction direction

- **Match the existing blue app** for chrome, and the **green dashboard's component vocabulary** for the health-specific pieces (gauge, band colours, weight editor, driver bars) so the two apps are visibly one product family.
- Cards: white, `#e2e7f0` border, radius 14, soft or no shadow. Section headings ~18px/800. Body ~14–15px. Numbers tabular.
- Colour semantics (reuse): healthy green `#1f8a3b`, watch amber `#b0781a`, attention red `#c23b3b`, neutral ink `#1a2530`, muted `#5f6b78`.
- Keep it **calm and legible** — the score's job is reassurance-at-a-glance then drill-down, not a wall of widgets. Two columns (Today/Tomorrow) beneath one hero; resist adding a third.
- **Signature interactions to get right:** (1) the live-recomputing weight editor on the score; (2) the Today actions dropping off as they're resolved; (3) the projection chart with source-tagged inputs.

---

## 9. Build order (so a first pass is reviewable fast)

1. Chrome + greeting + hero gauge with the five driver bars (static seed data) — **the concept, visible.**
2. Today column with the four seeded action rows + drop-on-resolve.
3. Tomorrow column: the 90-day projection chart + source-tagged inputs.
4. The "Adjust what counts" weight editor (live recompute).
5. Benchmark + year-end tiles; optional connected strip.
6. (Later task) wire the driver bars and action buttons to real destinations, and the cross-link to the accountant portfolio row.

Stub anything not in this pass with a clearly-labelled button rather than omitting it, so the full shape is legible.

---

## 10. Explicitly out of scope for this screen
- The accountant/portfolio view (already exists, green app).
- Building out each destination section (invoicing, banking, etc.) — this screen *links to* them.
- The white-label/technology-layer story.
- Real data / integrations — everything seeded & deterministic.

---

### One-paragraph summary for the Claude Design prompt
> Extend the existing blue FreeAgent owner app with a new default **Overview** screen: a business-owner **CFO command centre**. Centre it on a **Business Health score** (0–100 semicircle gauge, reusing the green dashboard's gauge and band colours) that decomposes into **five owner-meaningful, user-weightable drivers** — Getting paid, Cashflow, Tax readiness, Profitability, Growth & funding — with a live-recomputing "Adjust what counts" weight editor. Beneath the hero, two columns: **Today · act now** (chase overdue invoices, approve bill run, run payroll, VAT due — action rows that drop off when resolved) and **Tomorrow · see ahead** (a 90-day cashflow **projection chart** dipping to a −£549 shortfall on 1 Jan, with source-tagged connected inputs, plus benchmark-vs-peers and year-end-readiness tiles). Seed one business, **Rowan & Field**, deterministically. Match the existing blue chrome and the green app's component vocabulary so they read as one connected product family.
