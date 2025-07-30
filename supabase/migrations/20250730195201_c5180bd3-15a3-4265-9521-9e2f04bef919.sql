-- Create user_trade_summary view for fast strategy stats lookup
CREATE OR REPLACE VIEW public.user_trade_summary AS
SELECT
  user_id,
  strategy,
  COUNT(*) as total_trades,
  AVG(confidence) as avg_confidence,
  AVG(pnl) as avg_pnl,
  AVG(trade_duration) as avg_duration,
  COUNT(*) FILTER (WHERE tp1_hit OR tp2_hit OR tp3_hit) * 100.0 / NULLIF(COUNT(*), 0) as win_rate
FROM
  public.trade_history_log
GROUP BY
  user_id, strategy;

-- Create table to track trade counts for auto-retraining
CREATE TABLE public.user_trade_counters (
  user_id UUID PRIMARY KEY,
  trade_count INTEGER NOT NULL DEFAULT 0,
  last_retrain_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on trade counters
ALTER TABLE public.user_trade_counters ENABLE ROW LEVEL SECURITY;

-- Create policies for trade counters
CREATE POLICY "Users can view their own trade counter" 
ON public.user_trade_counters 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own trade counter" 
ON public.user_trade_counters 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trade counter" 
ON public.user_trade_counters 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to handle trade counter updates and trigger retraining
CREATE OR REPLACE FUNCTION public.handle_trade_insert()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
BEGIN
  -- Insert or update trade counter
  INSERT INTO public.user_trade_counters (user_id, trade_count)
  VALUES (NEW.user_id, 1)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    trade_count = user_trade_counters.trade_count + 1,
    updated_at = now();

  -- Get current count
  SELECT trade_count INTO current_count 
  FROM public.user_trade_counters 
  WHERE user_id = NEW.user_id;

  -- If reached 50 trades, trigger retraining
  IF current_count >= 50 THEN
    -- Reset counter and update retrain timestamp
    UPDATE public.user_trade_counters 
    SET trade_count = 0, last_retrain_at = now()
    WHERE user_id = NEW.user_id;

    -- Call edge function for ML retraining (async)
    PERFORM net.http_post(
      url := 'https://gjtetfgujpcyhjenudnb.supabase.co/functions/v1/ml-retrain',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.jwt_token', true)
      ),
      body := jsonb_build_object(
        'user_id', NEW.user_id::text,
        'trigger', 'auto_retrain_50_trades'
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on trade_history_log
CREATE TRIGGER trigger_trade_counter_update
  AFTER INSERT ON public.trade_history_log
  FOR EACH ROW EXECUTE FUNCTION public.handle_trade_insert();

-- Add updated_at trigger for trade counters
CREATE TRIGGER update_user_trade_counters_updated_at
  BEFORE UPDATE ON public.user_trade_counters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();