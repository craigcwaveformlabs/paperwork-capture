# FreeAgent data context — API resources → portfolio insights

*Append to the v4 prompt. This is grounded in the FreeAgent API (dev.freeagent.com/docs): the left column is a real API resource; the right is the insight-relevant signal we'd derive from it at portfolio level. This is what makes the prototype FreeAgent-real rather than a Xero clone — the indicators trace to actual FreeAgent objects. Portfolio-wide access is via the Accountancy Practice API.*

*Note on derivation: raw resources aren't insights on their own. Example — the Bank Transactions resource lists transactions; the insight is the count of them without a matching Bank Transaction Explanation, i.e. "unexplained" items. Unexplained data means incomplete records, which undermines accurate VAT/tax figures — so it's a leading indicator of bookkeeping health, not just a tidiness metric.*

---

## View 2 — Bookkeeping health (feeds the weighted score)

| API resource | Insight signal (why it matters) |
|---|---|
| Bank Transactions + Bank Transaction Explanations | **Unexplained transactions** (count, value, oldest date) — the core "missing data" signal; unexplained items mean tax figures can't be trusted yet. Primary score check. |
| Bank Feeds | **Feed status** (connected / broken / last refresh) — a broken or stale feed means the whole account is out of date. |
| Bank Accounts | **Reconciliation state** — balance vs statement, days since reconciled. |
| Invoices | Draft/unsent invoices; invoices not matched to a bank payment. |
| Bills | Draft/unentered bills; bills awaiting payment matching. |
| Transactions / Journal Sets | Manual journals / adjustments (volume can indicate correction effort). |
| Contacts | Duplicate or incomplete contacts (data-quality check). |
| Account Locks | Whether filed periods are locked (protects filed data). |

*Configurable weighted-score checks draw from this list. Unexplained transactions should be a prominent, high-weight default check.*

## View 3 — Compliance health (tax summaries & timelines)

| API resource | Insight signal |
|---|---|
| VAT Returns | Period, due date, status (open / ready / filed / overdue), estimated liability. |
| Income Tax Returns (MTD for IT) | Quarterly update periods, submission due dates, status, client-approval state. |
| Corporation Tax Returns | Accounting period, estimated liability, filing/payment deadlines. |
| Self Assessment Returns | Status, deadline. |
| Sales Tax Periods | Non-VAT sales-tax obligations where relevant. |
| Payroll | Pay-run / RTI submission timing. |

*Each obligation has a due date and status → drives the deadline timeline and the "Overdue by…" / "Needs attention" treatment (as on FreeAgent's MTD for Income Tax screen).*

## View 4 — Business health (reporting roll-ups)

| API resource | Insight signal |
|---|---|
| Profit & Loss | Revenue, expenses, net profit (period + comparative). |
| Cashflow | Cash position and recent direction; months of negative cashflow. |
| Balance Sheet / Trial Balance | Overall financial position; anomalies. |
| Invoices | Accounts receivable, aged debt, **average debtor days**, invoices overdue (count/value/days). |
| Bills | Accounts payable, aged creditors. |
| (Derived: VAT/CT liability vs cash) | Tax set-aside vs available cash — tax-exposure read (leans on FreeAgent's tax engine). |

## View 1 — General (composite across the above)

Roll the three views into one at-a-glance read per client. Metadata from: **Company** (business type, year end, VAT scheme), **Users** (owner access), **Accountancy Practice API** (account manager, client relationship, status).

---

**Instruction to Design:** Treat the right-hand "insight signal" column as the indicator vocabulary. Populate the ~15 sample clients with plausible values for these signals. Make **unexplained transactions** a headline bookkeeping signal and a high-weight default check in the configurable score. All figures illustrative sample data.
