# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/c63d62d5-26e9-47a3-ba0f-c8af7150b78f

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/c63d62d5-26e9-47a3-ba0f-c8af7150b78f) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/c63d62d5-26e9-47a3-ba0f-c8af7150b78f) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Strategy-led Signals & Paper/Live Toggles
- Signals are created/closed *only* by the selected strategy; entry_price is frozen at creation.
- Paper trades mirror the chosen strategy using live data. Use **/api/settings** to toggle and select strategy.
- Migration runs automatically on startup and is idempotent for Render.

## Supabase RLS (September 18, 2025)
- RLS is **enabled** on: `strategies`, `signals`, `signal_events`, `paper_trades`, `engine_settings`.
- Default posture: **locked** (no policies). Frontend should use **FastAPI**; backend continues to work
  via Postgres superuser connection or Supabase **service role** (both bypass RLS).
- If you later need direct Supabase reads from the browser for authenticated users, uncomment ONE of
  the optional `... for select to authenticated using (true)` policies in
  `supabase/migrations/2025-09-18_rls_enable.sql`, then deploy.

### Notes
- For multi-tenant per-user scoping, add a `owner_id uuid` column referencing `auth.users`
  and constrain policies with `auth.uid() = owner_id`. Not required for current single-tenant setup.

## Background Strategy Runner (per-strategy universe)
**Env (order matters):**
- `TICKLET_BG_ENABLED` — enable/disable background loop
- `TICKLET_BG_INTERVAL_SEC` — scan interval seconds (default 60)
- `TICKLET_SYMBOLS` — comma list or `any` to auto-resolve per strategy
- `TICKLET_TIMEFRAMES` — comma list (default `15m,30m,1h,1d`)
- `TICKLET_SUPABASE_URL`, `TICKLET_SUPABASE_ANON_KEY`, `TICKLET_SUPABASE_SCHEMA` — if provided, writes to Supabase; else CSV fallback
**Resolution rules:**
1) If `TICKLET_SYMBOLS != any`, use that explicit list for all strategies.
2) Else, use per-strategy configured lists when present.
3) Else, auto-select top USDT pairs by 24h quote volume from Binance.
**Endpoints:**
- `GET /bg/status` — shows current settings & whether Supabase is on.
**Output tables/files:**
- `signals` and `features` in Supabase (schema configurable), or `./data/signals.csv`, `./data/features.csv`.

## ML Pipeline (Unified, Supabase-first with CSV fallback)
Tables/CSVs:
- **signals**: one row per strategy pass (side, entries, stops, tps, anomaly, confidence, raw).
- **features**: indicators snapshot per pass.
- **trades**: one row per trade (open → updates → close), with `pnl_pct` and `win`.
- **actions**: audit log for every action (bg_scan, trade_open, trade_update, trade_close, etc).
Endpoints:
- `POST /ml/train` → trains RF and appends learning-curve point.
- `GET /ml/learning_curve` → curve JSON.
- `GET /ml/status` → model existence & path.
- `POST /ml/predict` → pass `{ "features": { ... } }` returns win-prob (0..1 as string).
Hook usage (you MUST call these in your trader flow):
- `on_entry_opened(trade_id, symbol, strategy, side, timeframe, entry, result)`
- `on_trade_updated(trade_id, updates_dict)`
- `on_trade_closed(trade_id, exit_price, hold_minutes, pnl_pct)` → triggers async training when enough rows exist.
Notes:
- Map adapters in this patch to your REAL function names/paths (no renames to your originals).
- CSV fallbacks live under `./data/` if Supabase env is not set.
