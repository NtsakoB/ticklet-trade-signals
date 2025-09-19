-- Add missing columns to existing signals table
ALTER TABLE public.signals 
ADD COLUMN IF NOT EXISTS side text DEFAULT 'BUY',
ADD COLUMN IF NOT EXISTS volatility_pct numeric,
ADD COLUMN IF NOT EXISTS leverage int,
ADD COLUMN IF NOT EXISTS anomaly numeric,
ADD COLUMN IF NOT EXISTS confidence numeric DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS stop_loss numeric,
ADD COLUMN IF NOT EXISTS ai_summary text,
ADD COLUMN IF NOT EXISTS low_entry boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS price_distance numeric;

-- Update side column constraint
ALTER TABLE public.signals 
DROP CONSTRAINT IF EXISTS signals_side_check,
ADD CONSTRAINT signals_side_check CHECK (side IN ('BUY','SELL'));

-- Update status column constraint
ALTER TABLE public.signals 
DROP CONSTRAINT IF EXISTS signals_status_check,
ADD CONSTRAINT signals_status_check CHECK (status IN ('active','open','closed','missed','expired'));

-- Enable RLS and create policies for signals table
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;

-- Create policies for signals (allow public read, service role write)
DROP POLICY IF EXISTS "signals_select_public" ON public.signals;
CREATE POLICY "signals_select_public" ON public.signals
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "signals_write_service" ON public.signals;
CREATE POLICY "signals_write_service" ON public.signals
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Enable RLS and create policies for trades table  
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trades_select_public" ON public.trades;
CREATE POLICY "trades_select_public" ON public.trades
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "trades_write_service" ON public.trades;
CREATE POLICY "trades_write_service" ON public.trades
  FOR ALL TO service_role USING (true) WITH CHECK (true);