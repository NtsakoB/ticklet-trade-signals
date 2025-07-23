-- Create chat_logs table for storing AI chat conversations
CREATE TABLE public.chat_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  strategy TEXT NOT NULL DEFAULT 'ecosystem',
  conversation JSONB NOT NULL DEFAULT '[]'::jsonb,
  title TEXT DEFAULT 'Untitled Chat',
  message_count INT GENERATED ALWAYS AS (jsonb_array_length(conversation)) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for user_id and timestamp
CREATE INDEX chat_logs_user_id_timestamp_idx ON chat_logs(user_id, timestamp DESC);

-- Enable Row Level Security
ALTER TABLE public.chat_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own chat logs" 
ON public.chat_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat logs" 
ON public.chat_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat logs" 
ON public.chat_logs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat logs" 
ON public.chat_logs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_chat_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_chat_logs_updated_at
BEFORE UPDATE ON public.chat_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_chat_logs_updated_at();

-- Create audit table for logging changes
CREATE TABLE public.chat_logs_audit (
  audit_id SERIAL PRIMARY KEY,
  chat_log_id UUID NOT NULL,
  operation TEXT NOT NULL,
  user_id UUID NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  old_value JSONB,
  new_value JSONB
);

-- Create function for audit logging
CREATE OR REPLACE FUNCTION log_chat_logs_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.chat_logs_audit (chat_log_id, operation, user_id, old_value, new_value)
  VALUES (OLD.id, TG_OP, auth.uid(), OLD.conversation, NEW.conversation);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for audit logging
CREATE TRIGGER chat_logs_audit_trigger
AFTER UPDATE OR DELETE ON public.chat_logs
FOR EACH ROW
EXECUTE FUNCTION log_chat_logs_changes();