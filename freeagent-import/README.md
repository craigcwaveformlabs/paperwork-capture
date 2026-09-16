# freeagent-import

A minimal Node.js scaffold for pushing real bank transactions into FreeAgent via
its public API. This is a separate, functioning integration — not part of the lo-fi
`html-prototype/` hackday demo one folder up.

No dependencies beyond Node 18+ (native `fetch`, a hand-rolled `.env` reader). Defaults
to FreeAgent's **sandbox** environment; production is an explicit opt-in.

## Setup

1. Register an app in the [FreeAgent Developer Dashboard](https://dev.freeagent.com/docs/quick_start)
   with redirect URI `http://localhost:8090/callback`.
2. `cp .env.example .env` and fill in `FREEAGENT_CLIENT_ID` / `FREEAGENT_CLIENT_SECRET`.
3. `npm run authorize` — opens the OAuth handshake, saves `tokens.json` locally
   (gitignored). Re-run any time you need to re-auth; access tokens auto-refresh
   after that using the saved refresh token.
4. `npm run bank-accounts` — lists your sandbox company's bank accounts and URLs.
5. `npm run categories` — lists category URLs grouped by
   `income_categories` / `cost_of_sales_categories` / `admin_expenses_categories` /
   `general_categories`. You'll need these URLs to categorise transactions.
6. Edit `data/example-transactions.json` (or write your own) with a real
   `bankAccount` URL and real `category` URLs from the previous step.
7. `npm run import -- data/example-transactions.json`

## What `import` does

1. Uploads all transactions in one batch to `POST /bank_transactions/statement`
   (FreeAgent dedupes on date + amount + description, so submit a day's transactions
   together).
2. Matches each input transaction with a `category` field back to the transaction
   FreeAgent just created (by date/amount/description) and posts a
   `bank_transaction_explanation` to categorise it.
3. If an input transaction has a `receipt` field (path to a PNG/JPEG/GIF/PDF, max 5MB),
   attaches it to that explanation.

## Environments

`FREEAGENT_ENV=sandbox` (default) talks to `api.sandbox.freeagent.com`.
Set `FREEAGENT_ENV=production` in `.env` only once you've verified the full flow
against sandbox — this pushes real data into your live FreeAgent account.

## Note on attachments

FreeAgent is replacing the single `attachment` field on explanations with a separate
attachments API (up to 50 files) from **1 Dec 2026**; this scaffold uses the current
singular-attachment shape. If you're picking this up after that date, check
`https://dev.freeagent.com/docs/attachments` before relying on `explainTransaction`'s
receipt handling.

## Files

```
src/
  config.js        env loading, sandbox/production host switching
  auth.js           OAuth handshake, token exchange/refresh, tokens.json persistence
  client.js         authenticated fetch wrapper with auto-refresh
  statement.js       bank statement upload
  explanations.js    transaction categorisation + receipt attachment
bin/
  authorize.js       run the OAuth handshake
  bank-accounts.js    list bank accounts
  categories.js       list category URLs
  import.js           upload + categorise transactions from a JSON file
data/
  example-transactions.json
```
