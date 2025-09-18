-- STRATEGIES registry
create table if not exists strategies (
  name text primary key,
  active boolean not null default true
);
insert into strategies(name) values
  ('TickletAlpha'),('GoldenHook'),('MarketRegime')
on conflict do nothing;

-- SIGNALS (entry frozen, lifecycle persisted)
create table if not exists signals (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  strategy text not null references strategies(name) on update cascade,
  status text not null check (status in ('NEW','ACTIVE','CLOSED')),
  stage text not null default 'TP0',
  created_at timestamptz not null default now(),
  closed_at timestamptz,
  reason_closed text,
  entry_price numeric not null,
  stop_price numeric not null,
  targets jsonb not null,
  meta jsonb default '{}'::jsonb
);
create index if not exists signals_symbol_idx on signals(symbol);
create index if not exists signals_strategy_idx on signals(strategy);
create index if not exists signals_status_idx on signals(status);
create index if not exists signals_created_idx on signals(created_at desc);

-- SIGNAL EVENTS (fine-grained ML lineage)
create table if not exists signal_events (
  id bigserial primary key,
  signal_id uuid not null references signals(id) on delete cascade,
  at timestamptz not null default now(),
  event text not null,
  price numeric,
  details jsonb default '{}'::jsonb
);
create index if not exists signal_events_signal_idx on signal_events(signal_id);

-- PAPER TRADES (mirror signals; live data)
create table if not exists paper_trades (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid references signals(id) on delete set null,
  symbol text not null,
  strategy text not null references strategies(name) on update cascade,
  side text not null check (side in ('BUY','SELL')),
  leverage numeric,
  qty numeric not null,
  entry_price numeric not null,
  exit_price numeric,
  status text not null check (status in ('OPEN','CLOSED')) default 'OPEN',
  reason_closed text,
  pnl numeric,
  opened_at timestamptz not null default now(),
  closed_at timestamptz
);
create index if not exists paper_trades_symbol_idx on paper_trades(symbol);
create index if not exists paper_trades_strategy_idx on paper_trades(strategy);
create index if not exists paper_trades_status_idx on paper_trades(status);

-- ENGINE SETTINGS (single-row)
create table if not exists engine_settings (
  id boolean primary key default true,
  paper_enabled boolean not null default false,
  live_enabled boolean not null default false,
  paper_strategy text not null default 'TickletAlpha' references strategies(name) on update cascade
);
insert into engine_settings(id) values(true) on conflict do nothing;