-- Fix Ticklet table RLS policy issue
-- The table currently has no user_id column, so we need to either:
-- 1. Add user_id column and proper policy, or 
-- 2. Create a simple policy for the existing structure

-- Option 1: Add user_id column and create proper user-based policy
ALTER TABLE public."Ticklet" ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Create proper RLS policy for user-based access
DROP POLICY IF EXISTS "Allow read for team-bound Ticklet records" ON public."Ticklet";

CREATE POLICY "Users can manage their own Ticklet records"
ON public."Ticklet"
FOR ALL
USING (auth.uid() = user_id);

-- Fix audit table policies with proper search_path
CREATE OR REPLACE FUNCTION public.log_chat_logs_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.chat_logs_audit (
    chat_log_id, operation, user_id, old_value, new_value
  )
  VALUES (
    COALESCE(OLD.id, NEW.id), TG_OP, auth.uid(), 
    CASE WHEN OLD IS NOT NULL THEN OLD.conversation ELSE NULL END,
    CASE WHEN NEW IS NOT NULL THEN NEW.conversation ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION public.log_learning_entries_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.learning_entries_audit (
    learning_entry_id, operation, user_id, old_value, new_value
  )
  VALUES (
    COALESCE(OLD.id, NEW.id), TG_OP, auth.uid(),
    CASE WHEN OLD IS NOT NULL THEN OLD.context ELSE NULL END,
    CASE WHEN NEW IS NOT NULL THEN NEW.context ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;