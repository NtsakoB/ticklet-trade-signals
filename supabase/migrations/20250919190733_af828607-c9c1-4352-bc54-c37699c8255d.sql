-- Enable required extensions
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- signals table for live signal persistence
create table if not exists public.signals (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  side text check (side in ('BUY','SELL')) not null default 'BUY',
  entry_price numeric not null,
  volatility_pct numeric,
  leverage int,
  anomaly numeric,
  confidence numeric default 0.5,
  targets numeric[],
  stop_loss numeric,
  strategy text default 'TickletAlpha',
  ai_summary text,
  status text default 'active' check (status in ('active','open','closed','missed','expired')),
  low_entry boolean default false,
  price_distance numeric,        -- computed by job for low_price view
  created_at timestamptz not null default now()
);

-- trades table for paper/live trades
create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  mode text not null default 'paper' check (mode in ('paper','live')),
  strategy text not null default 'TickletAlpha',
  symbol text not null,
  entry_price numeric not null,
  qty numeric,
  status text not null default 'open' check (status in ('open','closed','cancelled')),
  pnl_abs numeric,
  pnl_pct numeric,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  leverage int default 1
);

-- Indexes for performance
create index if not exists idx_signals_created_at on public.signals (created_at desc);
create index if not exists idx_signals_symbol on public.signals (symbol);
create index if not exists idx_signals_status on public.signals (status);
create index if not exists idx_signals_price_distance on public.signals (price_distance asc) where status in ('active','open');
create index if not exists idx_trades_opened_at on public.trades (opened_at desc);
create index if not exists idx_trades_strategy on public.trades (strategy);
create index if not exists idx_trades_mode on public.trades (mode);

-- View for signals with computed fields
create or replace view public.signals_view as
select
  id, symbol, side, entry_price, volatility_pct, leverage, anomaly, confidence,
  targets, stop_loss, strategy, ai_summary, status, low_entry, price_distance, created_at,
  case 
    when targets is not null and array_length(targets, 1) >= 2 then 
      targets[2] / nullif(entry_price, 0) - 1
    else null 
  end as rr_tp2
from public.signals
order by created_at desc;

-- RPC: mark_low_entry when price is within buffer of entry range
create or replace function public.mark_low_entry(p_symbol text, p_current numeric, p_buffer numeric default 0.003)
returns void
language plpgsql
security definer
as $$
begin
  update public.signals
    set low_entry = true
  where symbol = upper(p_symbol)
    and abs((entry_price - p_current)/nullif(entry_price,0)) <= p_buffer
    and status = 'active';
end;
$$;

-- RPC: classify_missed_signals 
create or replace function public.classify_missed_signals(p_minutes int default 60)
returns integer
language plpgsql
security definer
as $$
declare
  v_count int;
begin
  update public.signals s
     set status = 'missed'
   where s.status = 'active'
     and s.created_at < now() - (p_minutes || ' minutes')::interval
     and not exists (
       select 1 from public.trades t
       where t.symbol = s.symbol
         and t.strategy = coalesce(s.strategy, t.strategy)
         and t.opened_at >= s.created_at
     );
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- RPC: update price distance for lowest price calculations
create or replace function public.update_price_distance(p_symbol text, p_current numeric)
returns void
language plpgsql
security definer
as $$
begin
  update public.signals
     set price_distance = abs(entry_price - p_current)
   where symbol = upper(p_symbol)
     and status in ('active','open');
end;
$$;

-- Enable RLS
alter table public.signals enable row level security;
alter table public.trades enable row level security;

-- Create policies (allow public read, service role write)
create policy "signals_select_public" on public.signals
  for select to anon using (true);

create policy "trades_select_public" on public.trades
  for select to anon using (true);

create policy "signals_write_service" on public.signals
  for all to service_role using (true) with check (true);

create policy "trades_write_service" on public.trades
  for all to service_role using (true) with check (true);