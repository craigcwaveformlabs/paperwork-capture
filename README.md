# paperwork-capture

A minimal app that connects to a real FreeAgent account (via OAuth) and posts MTD bridging
transactions into it from a CSV — no simulation, no local database.

## Run locally

```bash
npm install
cp .env.local.example .env.local   # fill in your FreeAgent Developer Dashboard app credentials
npm run dev
```

Open `/` and connect. Once connected:

- `/categories` — create the fixed set of MTD bridging categories in your account
- `/mtd-csv` — download a CSV template, fill it in, then upload it (with optional evidence
  files) to create real bank transactions, categorise them, and attach evidence

## How it works

1. **Connect** (`/api/oauth/connect`, `/api/oauth/callback`) — standard OAuth2
   authorization-code flow against FreeAgent's sandbox or production API. Tokens are stored
   in `data/freeagent-tokens.json` (gitignored) — this app is single-tenant, for the
   developer's own account, not a multi-client portal.
2. **Categories** (`/api/categories`) — creates a fixed list of `bridging-*` categories
   (`lib/freeagent/bridgingCategories.ts`), skipping any nominal code already in use.
3. **CSV upload** (`/api/mtd-csv/upload`) — parses `date,description,amount,category,
   receipt_filename` rows, posts them via FreeAgent's bulk statement endpoint, re-fetches
   the created transactions to match them back (the statement endpoint replies with an
   empty body), then explains each one against its resolved category. If a row names an
   evidence file, it's base64-attached inline on that row's explanation — FreeAgent has no
   standalone "create file" endpoint, so this is the only way to attach evidence.

## Stack

- Next.js App Router + TypeScript, Tailwind CSS
- No database — FreeAgent's API is the only source of truth; OAuth tokens are the only
  local state

## Setup note

FreeAgent OAuth requires the redirect URI to exactly match one registered on your app in
the Developer Dashboard. This app defaults to `http://localhost:3000/api/oauth/callback` —
register that (or override `FREEAGENT_REDIRECT_URI` in `.env.local` to match what you've
registered).

## Also in this repo

- `html-prototype/` — a static, no-backend click-through mockup of the wider
  accountant/client paperwork journey (not connected to this app).
- `freeagent-import/` — the original standalone Node CLI this app's FreeAgent logic was
  ported from.
