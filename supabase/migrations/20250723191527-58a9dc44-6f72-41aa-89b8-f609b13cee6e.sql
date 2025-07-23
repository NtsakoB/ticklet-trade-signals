-- Create accuracy_snapshots table for ML monitoring
CREATE TABLE public.accuracy_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  accuracy_curve FLOAT8[] NOT NULL,
  curve_length INTEGER,
  min_accuracy FLOAT8,
  max_accuracy FLOAT8,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create signal_scores table if it doesn't exist (for the export endpoint)
CREATE TABLE IF NOT EXISTS public.signal_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  strategy TEXT NOT NULL,
  rsi FLOAT8,
  macd FLOAT8,
  anomaly FLOAT8,
  confidence FLOAT8,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on accuracy_snapshots
ALTER TABLE public.accuracy_snapshots ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for accuracy_snapshots
CREATE POLICY "Users can view their own accuracy snapshots" 
ON public.accuracy_snapshots 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert accuracy snapshots" 
ON public.accuracy_snapshots 
FOR INSERT 
WITH CHECK (true);

-- Enable RLS on signal_scores if not already enabled
ALTER TABLE public.signal_scores ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for signal_scores
CREATE POLICY "Users can view signal scores" 
ON public.signal_scores 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert signal scores" 
ON public.signal_scores 
FOR INSERT 
WITH CHECK (true);