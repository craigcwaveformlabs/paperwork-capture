# paperwork-capture

A working prototype of an accountant→client paperwork request loop for FreeAgent.

## Run locally

```bash
npm install
npm run seed:reset
npm run dev
```

Open:
- `/banking/1` accountant transactions and request/approve workflow
- `/requests` request tracker
- `/smart-capture` uploaded documents and metrics
- `/outbox` simulated email outbox
- `/p/<token>` client upload page (no auth token link)

## Stack

- Next.js App Router + TypeScript
- SQLite via `better-sqlite3`
- Tailwind CSS (FreeAgent tokens in `tailwind.config.ts`)
- Anthropic SDK server-side in `lib/extraction.ts`
- Vitest tests for matching + safe-zone invariants

## Scripts

- `npm run seed` seed once if DB empty
- `npm run seed:reset` reset DB and reseed demo data
- `npm run test` run unit tests
- `npm run lint`
- `npm run build`

## Important prototype constraints

- One document maps to one source item and one transaction.
- Bank statements are flagged unsupported and left unmatched.
- Client uploads consume client Smart Capture allowance.
- Documents inherit privacy from request settings.
- Auto-explanations always go to `for_approval`; only `/api/approve` can set `explained`.

## Open decision to revisit

Tokenised no-login upload links are currently long random tokens with due-date context only. A production decision is still needed on expiry, single-use/reusable behaviour, and whether a second factor is required.
