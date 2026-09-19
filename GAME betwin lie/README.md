# Verdant Signal

Verdant Signal is a new, standalone Express + SQLite application for AI-assisted analysis of simulated game rounds. It supports Aviator, Chicken Road, Apple of Fortune, Mines and Football Penalties.

The product is intentionally demo-only. It does not connect to external gaming platforms, collect passwords/cookies/tokens, automate play or bets, process payments, or guarantee outcomes. Analysis is labelled `DEMO ANALYSIS` and `SIMULATED DATA` throughout the UI.

## Run

```bash
npm install
npm start
```

Open `http://localhost:3000` and use any valid Player ID plus Access Code for the local demo. The first successful login opens onboarding. The admin surface is at `http://localhost:3000/admin` and uses `ADMIN_PASSWORD` from `.env` (the development fallback is intentionally not a real secret; set your own value).

## Verify

```bash
npm test
git diff --check
```

Browser QA should cover login, onboarding, all five game panels, analysis, copy result, profile, activity, withdrawal dialog, language switching, legal dialogs, logout, `/admin`, and 320px/390px/430px layouts.

## Structure

- `server/` - Express routes, SQLite schema, catalogs and level rules.
- `public/` - vanilla HTML/CSS/JavaScript client, admin client and translations.
- `test/` - Node test runner + Supertest API contracts.
- `docs/` - skill inventory, design direction and implementation evidence.
- `data/` - runtime SQLite database, ignored by Git.

## Data and privacy

The app stores an HMAC player identifier, a safe display hint, a bcrypt access-code hash, profile choices, activity days, bonus ledger entries, game events and analysis history. Session cookies are httpOnly and signed. No card, wallet, cookie, token or external-account credential fields exist in the product.
