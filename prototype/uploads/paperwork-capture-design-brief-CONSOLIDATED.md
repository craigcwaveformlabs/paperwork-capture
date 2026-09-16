# Claude Design brief — Paperwork Capture

*Single consolidated brief. Paste everything below the line into Claude Design.*

**Attach alongside it:** the seven FreeAgent sandbox screenshots (Banking transaction list, expanded explanation form, For approval tab with bulk selection, Smart Capture area, expanded Smart Capture row, Attach from saved files modal, explained transaction with attachment) and the Labs Build PDF with the concept mocks.

---

# Paperwork Capture — interactive prototype

## What we're building

A flow where an accountant requests missing paperwork (receipts, invoices, statements) from a client, the client uploads it **without logging into FreeAgent**, and the files are matched and attached to the right bank transactions.

The insight that shapes everything: **the client doesn't live in FreeAgent.** The journey's centre of gravity is email and mobile, not the web app. FreeAgent is where the accountant starts and finishes; the middle happens wherever the client already is.

Mock data throughout. Uploads simulated.

## What already exists (build on it, don't reinvent it)

FreeAgent already has **Smart Capture**, which extracts a receipt's date and amount automatically and matches it to a bank transaction dated between the receipt date and two business days after. Matched files show as `Matched` with an orange eye icon. Files with no match can be turned into an expense or a bill.

It also already has the **'For approval'** pattern: transactions explained automatically are flagged orange for a human to confirm, never written silently.

**So the genuinely new part is the request loop** — selecting transactions, asking a named client for specific paperwork, giving them a no-login surface to respond, and tracking the chase. Everything downstream plugs into existing behaviour, and the prototype should look like it belongs to that behaviour.

---

## Visual system — accountant screens (inside FreeAgent)

Match these exactly; they're taken from the real product.

**Chrome**
- Dark charcoal top utility bar. Right side: a white outlined `Return to your dashboard` button (shown when an accountant is viewing a client's account — that's our context).
- **Blue primary nav**, white labels: `Overview · Contacts · Work ▾ · Bills · Expenses · Banking ▾ · Taxes ▾ · Accounting ▾`. Active item is a **darker blue block**. Right: notification bell with a yellow badge, then `[Client name] ▾`.
- Page header: the bank account name as a dropdown, e.g. **`Mettle ▾`**.
- **Header action buttons are white with blue text and a light blue border** — `Upload statement`, `Enable bank feed`, `Edit details`, `More ▾`. **Not green.**
- Dark navy footer.

**Colour discipline — important:** green is used *only* for the primary confirm action inside a form or panel (`Approve & save changes`, `Approve 4 explanations`, `Attach selected`). Everything else is white with blue text. Red-outlined buttons are for destructive actions (`Remove 4 explanations`).

**Transaction table**
- Tabs: `All transactions · Unexplained · For approval (9) · Manually added`. **The For approval count pill is orange**; others have no pill.
- Period dropdown below the tabs, e.g. `July 26`.
- Columns: checkbox · `Date ▲` (blue, sortable) · `Description` (blue, sortable) · Money in · Money out · Balance. First row italic `Balance brought forward`.
- Row states:
  - **For approval** — orange eye icon, **merchant name in orange bold**, then category in normal dark text
  - **Explained** — green tick, **merchant name in green bold**
  - **Unexplained** — red `?`
  - **Manually added** — purple person icon
  - Beneath each: a grey raw-description line like `NOTTING HILL TRUST//OTHER/£564.69`
- Legend at the foot: `✓ Explained` · `? Unexplained` · `👤 Manually added` · `👁 Marked for approval`
- `25 ▾` per page, bottom left.

**Right-hand panel (default)** — three stacked white cards: *Statement upload* (green pill `✓ Good job. Now relax.`), *For approval* (grouped by category as blue links with grey count pills, then `Total for approval` with an orange pill), *Bank details* (total balance).

**Key behaviour:** the right panel **swaps when rows are selected**. Today, selecting for-approval rows replaces it with `Approve explanations` and `Remove explanations` cards. Our request flow must follow exactly this pattern.

**Inline explanation form** — clicking a transaction expands the form **inline beneath the row**, not in the side panel: `Type` dropdown · `Including` VAT dropdown · `Category` dropdown with a blue link beneath · `Description` field · `Add attachments` with `Upload files` or `Choose from saved` and the note *"10 file max per upload, max file size per file 5MB"* · green `Approve & save changes` · blue `Cancel` · right-aligned white `Adjustments ▾`.

**Copy conventions:** sentence case (`Approve & save changes`, not Title Case). Counts inline in button labels (`Approve 4 explanations`). Product vocabulary: *explain* / *unexplained* / *For approval* / *Money in* / *Money out* / *Smart Capture* / *bank feed*.

## Visual system — client screens (outside FreeAgent)

Completely different register. The client has no login, no accounting knowledge, and is probably on a phone. Plain, minimal branding, mobile-first, generous spacing, one clear green CTA per screen. No nav bars, no jargon, no FreeAgent chrome.

---

## Screens to build

### 1 — Bank transactions with request panel (accountant)
The `Business Current Account` view, `Unexplained` tab active. Selecting one or more rows **swaps the right-hand panel** to:

> **Request paperwork**
> We'll send an email to your client from which they can upload the right paperwork. We'll then explain the transaction for you.
> `[ Request paperwork for 6 transactions ]` (green)

Include a select-all affordance and a live count.

### 2 — Request composer (accountant)
Panel or modal: the selected transactions listed (date, merchant, amount) each removable; client contact and email pre-filled; a due date; an optional short message; delivery toggles for **Email** and **App notification**. Green `Send request`.

### 3 — Request email (client)
Shown in an inbox. From their accountant, brief and personal:
> Your accountant, Jim Jones, has asked for the following paperwork to complete your bookkeeping. Upload the files here and we'll do the rest.

Itemised list (`23/05/2026 — Scotrail`, `24/06/2026 — Sainsburys`, `12/04/2025 — B&Q Newcastle`) and a green `Upload files` CTA.

### 4 — Client upload page (mobile-first)
Requested items as cards — date, merchant, amount, upload slot each. Large drag-and-drop zone plus a **Take photo** option. Files associate to an item with a thumbnail and can be reassigned. Progress indicator (`3 of 6 provided`). Green `Upload files`.

**Include the photo guidance** as a short hint, since it materially improves extraction: photograph it promptly, flatten creases, check focus, flash off, dark background, shoot straight on.

Constraints to respect: images or PDFs, 5MB per file, 10 files per upload.

Then a confirmation state: what's received, what's outstanding.

### 5 — Return notification (accountant)
Right panel shows:
> **Request paperwork**
> 3 paperwork requests have been uploaded to this account.
> `[ Review ]` (green)

Notification bell carries a badge.

### 6 — Review using the existing 'For approval' pattern (accountant)
**This must follow FreeAgent's real behaviour, not a new Accept/Reject pattern.**

When paperwork is attached, an explanation is generated and the transaction moves to the **For approval** tab: orange text, orange eye icon. Nothing is written to the books yet.

- Selecting a transaction expands the **inline form** showing the extracted data (merchant, date, amount, VAT) with the **Smart Capture lightning icon** beside extracted values, the attached file with a thumbnail, `Remove` and `Download`, an `Attachment note` field, and the suggested category.
- Green **`Approve & save changes`**.
- **Bulk:** ticking rows reveals a select-all checkbox in the header, and the right panel swaps to `Approve explanations` (green `Approve 4 explanations`) and `Remove explanations` (red-outlined `Remove 4 explanations`).
- When the suggestion is wrong, the `Category` dropdown shows **alternative suggested categories at the top** of the list.

Show three cases: a confident match, a **low-confidence** one (blurry receipt, ambiguous match), and one where **no transaction matched** — which should route to `Create expense` / `Create bill`, as Smart Capture already does.

### 7 — Request tracker (accountant)
Outstanding requests: client, items requested, items received, status (`Sent` / `Viewed` / `Partially fulfilled` / `Complete` / `Overdue`), date sent, days outstanding, with a chase action per row. Status tabs with count pills. Group counts in the right panel (`Awaiting client 6`, `Overdue 2`) mirroring the For approval panel's grouping.

### 8 — Enable bank feed via email (bonus)
For a client with no feed: email with a green `Connect bank account` CTA → bank selector → consent screen listing what FreeAgent will access (account name, number and sort code; balance; transactions; explanations) → `Bank Feed Connected` confirmation.

---

## States to include
No unexplained transactions (nothing to request) · a request with nothing uploaded yet · a partially fulfilled request · a low-confidence extraction · no matching transaction · a duplicate upload · an unreadable file · paperwork arriving for an **already-approved** transaction (which then needs re-approving).

## Mock data
A realistic UK small-business current account: ~20 transactions, merchants like Scotrail, Sainsburys, B&Q Newcastle, Local Council, Virgin Mobile, Community Fibre. Plausible amounts and dates. All figures illustrative sample data.

---

## Build in this order — don't attempt everything at once

Generate each, let me react, then continue:

1. **Screen 1** — get the FreeAgent in-app look right here; everything inherits it
2. **Screen 2** — the request composer
3. **Screens 3 and 4** — the client's email and upload page (switch visual register completely)
4. **Screens 5 and 6** — return notification and the For approval review flow
5. **Screen 7** — the request tracker
6. **Screen 8** — the bank feed flow, if there's appetite

Then link them into a single clickable journey that can be walked end to end: accountant requests → client receives and uploads → accountant reviews and approves.

**Start with Screen 1.**
