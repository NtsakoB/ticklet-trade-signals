-- Replace existing update_chat_logs_updated_at function with secure version
CREATE OR REPLACE FUNCTION public.update_chat_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '';