-- Create helper functions for signals processing
CREATE OR REPLACE FUNCTION public.mark_low_entry(p_symbol text, p_current numeric, p_buffer numeric default 0.003)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.signals
    SET low_entry = true
  WHERE symbol = upper(p_symbol)
    AND abs((entry_price - p_current)/nullif(entry_price,0)) <= p_buffer
    AND status = 'active';
END;
$$;

CREATE OR REPLACE FUNCTION public.classify_missed_signals(p_minutes int default 60)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count int;
BEGIN
  UPDATE public.signals s
     SET status = 'missed'
   WHERE s.status = 'active'
     AND s.created_at < now() - (p_minutes || ' minutes')::interval
     AND NOT EXISTS (
       SELECT 1 FROM public.trades t
       WHERE t.symbol = s.symbol
         AND t.strategy = COALESCE(s.strategy, t.strategy)
         AND t.opened_at >= s.created_at
     );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_price_distance(p_symbol text, p_current numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.signals
     SET price_distance = abs(entry_price - p_current)
   WHERE symbol = upper(p_symbol)
     AND status IN ('active','open');
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_signals_created_at ON public.signals (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signals_symbol ON public.signals (symbol);
CREATE INDEX IF NOT EXISTS idx_signals_status ON public.signals (status);
CREATE INDEX IF NOT EXISTS idx_signals_price_distance ON public.signals (price_distance ASC) WHERE status IN ('active','open');
CREATE INDEX IF NOT EXISTS idx_trades_opened_at ON public.trades (opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_strategy ON public.trades (strategy);
CREATE INDEX IF NOT EXISTS idx_trades_mode ON public.trades (mode);