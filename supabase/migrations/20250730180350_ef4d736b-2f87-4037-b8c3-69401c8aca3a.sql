-- Create trade_history_log table for tracking trade outcomes
CREATE TABLE public.trade_history_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  strategy TEXT NOT NULL DEFAULT 'ecosystem',
  signal_id TEXT,
  entry_price DECIMAL(18,8),
  tp1_price DECIMAL(18,8),
  tp2_price DECIMAL(18,8), 
  tp3_price DECIMAL(18,8),
  stop_loss_price DECIMAL(18,8),
  tp1_hit BOOLEAN DEFAULT FALSE,
  tp2_hit BOOLEAN DEFAULT FALSE,
  tp3_hit BOOLEAN DEFAULT FALSE,
  stop_loss_hit BOOLEAN DEFAULT FALSE,
  confidence DECIMAL(5,2),
  pnl DECIMAL(18,8),
  trade_duration INTEGER, -- duration in minutes
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trade_history_log ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own trade history" 
ON public.trade_history_log 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own trade history" 
ON public.trade_history_log 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trade history" 
ON public.trade_history_log 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trade history" 
ON public.trade_history_log 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_trade_history_log_updated_at
BEFORE UPDATE ON public.trade_history_log
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_trade_history_log_user_strategy ON public.trade_history_log(user_id, strategy);
CREATE INDEX idx_trade_history_log_symbol ON public.trade_history_log(symbol);
CREATE INDEX idx_trade_history_log_created_at ON public.trade_history_log(created_at);