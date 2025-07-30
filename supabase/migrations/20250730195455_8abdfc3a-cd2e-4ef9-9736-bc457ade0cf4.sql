-- Fix security issues identified by the linter

-- First, drop the view and recreate it properly for RLS
DROP VIEW IF EXISTS public.user_trade_summary;

-- Update the function to set search_path
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';