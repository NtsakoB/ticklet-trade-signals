-- First check if signals table exists and what columns it has
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'signals') THEN
        -- Create signals table if it doesn't exist
        CREATE TABLE public.signals (
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
            price_distance numeric,
            created_at timestamptz not null default now()
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trades') THEN
        -- Create trades table if it doesn't exist
        CREATE TABLE public.trades (
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
    END IF;
END $$;