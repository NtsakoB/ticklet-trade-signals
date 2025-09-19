set search_path to public;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  NEW.updated_at = now();
  return NEW;
end $$;

create table if not exists public.signals (
  ts_utc        bigint not null,
  symbol        text   not null,
  timeframe     text   not null,
  strategy      text   not null,
  status        text,
  side          text,
  entry_low     double precision,
  entry_high    double precision,
  stop          double precision,
  tp1           double precision,
  tp2           double precision,
  tp3           double precision,
  confidence    double precision,
  anomaly       double precision,
  pump_conf     double precision,
  raw           jsonb,
  inserted_at   timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint signals_pk primary key (ts_utc, symbol, timeframe, strategy)
);
create index if not exists signals_ts_idx     on public.signals (ts_utc desc);
create index if not exists signals_sym_tf_idx on public.signals (symbol, timeframe);
create trigger signals_tupd before update on public.signals
for each row execute procedure public.set_updated_at();

create table if not exists public.features (
  ts_utc            bigint not null,
  symbol            text   not null,
  timeframe         text   not null,
  strategy          text   not null,
  rsi               double precision,
  macd              double precision,
  vol               double precision,
  atr               double precision,
  ema_fast          double precision,
  ema_slow          double precision,
  bb_upper          double precision,
  bb_lower          double precision,
  funding_rate      double precision,
  spread            double precision,
  bid_ask_imbalance double precision,
  volatility        double precision,
  regime            double precision,
  trending_score    double precision,
  anomaly_score     double precision,
  raw               jsonb,
  inserted_at       timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint features_pk primary key (ts_utc, symbol, timeframe, strategy)
);
create index if not exists features_ts_idx     on public.features (ts_utc desc);
create index if not exists features_sym_tf_idx on public.features (symbol, timeframe);
create trigger features_tupd before update on public.features
for each row execute procedure public.set_updated_at();

create table if not exists public.trades (
  trade_id         text primary key,
  ts_open          bigint,
  ts_close         bigint,
  symbol           text,
  strategy         text,
  side             text,
  timeframe        text,
  entry            double precision,
  exit             double precision,
  hold_minutes     integer,
  pnl_pct          double precision,
  win              integer,
  rsi               double precision,
  macd              double precision,
  vol               double precision,
  atr               double precision,
  ema_fast          double precision,
  ema_slow          double precision,
  bb_upper          double precision,
  bb_lower          double precision,
  funding_rate      double precision,
  spread            double precision,
  bid_ask_imbalance double precision,
  volatility        double precision,
  regime            double precision,
  trending_score    double precision,
  anomaly_score     double precision,
  raw              jsonb,
  inserted_at      timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists trades_ts_open_idx on public.trades (ts_open desc);
create index if not exists trades_symbol_idx  on public.trades (symbol);
create index if not exists trades_strategy_tf on public.trades (strategy, timeframe);
create trigger trades_tupd before update on public.trades
for each row execute procedure public.set_updated_at();

create table if not exists public.actions (
  id          bigserial primary key,
  ts_utc      bigint not null,
  event       text   not null,
  symbol      text,
  strategy    text,
  timeframe   text,
  details     jsonb,
  inserted_at timestamptz not null default now()
);
create index if not exists actions_ts_idx     on public.actions (ts_utc desc);
create index if not exists actions_event_idx  on public.actions (event);
create index if not exists actions_symbol_idx on public.actions (symbol);

alter table public.signals  disable row level security;
alter table public.features disable row level security;
alter table public.trades   disable row level security;
alter table public.actions  disable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.signals  to anon, authenticated;
grant select, insert, update, delete on public.features to anon, authenticated;
grant select, insert, update, delete on public.trades   to anon, authenticated;
grant select, insert, update, delete on public.actions  to anon, authenticated;