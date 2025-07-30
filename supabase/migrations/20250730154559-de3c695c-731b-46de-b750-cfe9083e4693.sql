-- Create report_failures table for logging scheduler failures
CREATE TABLE public.report_failures (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    component TEXT NOT NULL,
    detail TEXT NOT NULL,
    meta JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.report_failures ENABLE ROW LEVEL SECURITY;

-- Create policy for inserting failure logs (allow all inserts for system logging)
CREATE POLICY "Allow system to insert failure logs" 
ON public.report_failures 
FOR INSERT 
WITH CHECK (true);

-- Create policy for reading failure logs (authenticated users only)
CREATE POLICY "Authenticated users can view failure logs" 
ON public.report_failures 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Create index for timestamp queries
CREATE INDEX idx_report_failures_timestamp ON public.report_failures(timestamp DESC);

-- Create index for component queries
CREATE INDEX idx_report_failures_component ON public.report_failures(component);