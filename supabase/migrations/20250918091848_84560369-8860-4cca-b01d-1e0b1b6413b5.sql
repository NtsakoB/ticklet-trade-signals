-- ==========================================================
-- Row Level Security (RLS) setup
-- Default posture: ENABLE RLS, NO policies => deny all to anon/auth users.
-- Backend with service role or Postgres superuser continues to operate.
-- ==========================================================

-- Ensure tables exist (no-op if already created by earlier migration)
-- strategies, signals, signal_events, paper_trades, engine_settings
-- RLS ON
alter table if exists strategies       enable row level security;
alter table if exists signals          enable row level security;
alter table if exists signal_events    enable row level security;
alter table if exists paper_trades     enable row level security;
alter table if exists engine_settings  enable row level security;

-- No public policies created here => locked down by default.
-- Service Role (via Supabase APIs) and the 'postgres' superuser bypass RLS.

-- ==========================================================
-- OPTIONAL Policies (COMMENTED OUT)
-- Uncomment carefully if you want READ-ONLY for authenticated users.
-- Replace conditions as needed (e.g., org scoping, user_id columns).
-- ==========================================================

-- Example: allow authenticated users to SELECT minimal data from strategies
-- create policy "read_strategies_auth"
-- on strategies for select
-- to authenticated
-- using (true);

-- Example: allow authenticated users to SELECT signals (read-only dashboard)
-- create policy "read_signals_auth"
-- on signals for select
-- to authenticated
-- using (true);

-- Example: allow authenticated users to SELECT signal_events (granular history)
-- create policy "read_signal_events_auth"
-- on signal_events for select
-- to authenticated
-- using (true);

-- Example: allow authenticated users to SELECT open paper trades
-- create policy "read_paper_trades_auth"
-- on paper_trades for select
-- to authenticated
-- using (true);

-- ENGINE SETTINGS are sensitive; keep private unless you really want to expose.
-- Example (NOT RECOMMENDED): read-only engine settings for authenticated
-- create policy "read_engine_settings_auth"
-- on engine_settings for select
-- to authenticated
-- using (true);