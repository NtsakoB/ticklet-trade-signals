-- Create learning_entries table for AI feedback learning
CREATE TABLE public.learning_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  strategy TEXT NOT NULL,
  instruction TEXT NOT NULL,
  context JSONB NOT NULL DEFAULT '[]'::jsonb,
  response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for user_id and timestamp
CREATE INDEX learning_entries_user_id_timestamp_idx ON learning_entries(user_id, timestamp DESC);

-- Add constraint on strategy field
ALTER TABLE public.learning_entries ADD CONSTRAINT strategy_check
CHECK (strategy IN ('ecosystem', 'growth', 'performance'));

-- Enable RLS
ALTER TABLE public.learning_entries ENABLE ROW LEVEL SECURITY;

-- Define RLS policies
CREATE POLICY "Users can view their own learning entries"
ON public.learning_entries
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own learning entries"
ON public.learning_entries
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning entries"
ON public.learning_entries
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own learning entries"
ON public.learning_entries
FOR DELETE
USING (auth.uid() = user_id);

-- Timestamp update function with restricted search_path
CREATE OR REPLACE FUNCTION public.update_learning_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- Trigger for automatic updated_at refresh
CREATE TRIGGER update_learning_entries_updated_at
BEFORE UPDATE ON public.learning_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_learning_entries_updated_at();

-- Audit table for logging changes
CREATE TABLE public.learning_entries_audit (
  audit_id SERIAL PRIMARY KEY,
  learning_entry_id UUID NOT NULL,
  operation TEXT NOT NULL,
  user_id UUID NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  old_value JSONB,
  new_value JSONB
);

-- Audit logging function
CREATE OR REPLACE FUNCTION log_learning_entries_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.learning_entries_audit (learning_entry_id, operation, user_id, old_value, new_value)
  VALUES (OLD.id, TG_OP, auth.uid(), OLD.context, NEW.context);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for audit logging
CREATE TRIGGER learning_entries_audit_trigger
AFTER UPDATE OR DELETE ON public.learning_entries
FOR EACH ROW
EXECUTE FUNCTION log_learning_entries_changes();