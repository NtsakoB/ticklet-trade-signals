-- Convert auth.uid()/current_setting() in USING/WITH CHECK to (select auth.uid()) across key tables (perf fix).
ALTER POLICY IF EXISTS "Users can view their own chat logs" ON public.chat_logs USING (user_id = (SELECT auth.uid()));

ALTER POLICY IF EXISTS "Users can create their own chat logs" ON public.chat_logs WITH CHECK (user_id = (SELECT auth.uid()));

ALTER POLICY IF EXISTS "Users can update their own chat logs" ON public.chat_logs USING (user_id = (SELECT auth.uid()));

ALTER POLICY IF EXISTS "Users can delete their own chat logs" ON public.chat_logs USING (user_id = (SELECT auth.uid()));

ALTER POLICY IF EXISTS "Users can view their own learning entries" ON public.learning_entries USING (user_id = (SELECT auth.uid()));

ALTER POLICY IF EXISTS "Users can insert their own learning entries" ON public.learning_entries WITH CHECK (user_id = (SELECT auth.uid()));

ALTER POLICY IF EXISTS "Users can update their own learning entries" ON public.learning_entries USING (user_id = (SELECT auth.uid()));

ALTER POLICY IF EXISTS "Users can delete their own learning entries" ON public.learning_entries USING (user_id = (SELECT auth.uid()));

ALTER POLICY IF EXISTS "Users can manage their own Ticklet records" ON public."Ticklet" USING (user_id = (SELECT auth.uid()));

ALTER POLICY IF EXISTS "Users can view their own trade history" ON public.trade_history_log USING (user_id = (SELECT auth.uid()));

ALTER POLICY IF EXISTS "Users can create their own trade history" ON public.trade_history_log WITH CHECK (user_id = (SELECT auth.uid()));

ALTER POLICY IF EXISTS "Users can update their own trade history" ON public.trade_history_log USING (user_id = (SELECT auth.uid()));

ALTER POLICY IF EXISTS "Users can delete their own trade history" ON public.trade_history_log USING (user_id = (SELECT auth.uid()));

ALTER POLICY IF EXISTS "Users can view their own trade counter" ON public.user_trade_counters USING (user_id = (SELECT auth.uid()));

ALTER POLICY IF EXISTS "Users can update their own trade counter" ON public.user_trade_counters USING (user_id = (SELECT auth.uid()));

-- Consolidate duplicate permissive policies to one per role/action (examples for common duplicates).
DROP POLICY IF EXISTS "Only Ntsako can read" ON public.learning_entries;
DROP POLICY IF EXISTS "Only Ntsako can read" ON public.signal_scores;
DROP POLICY IF EXISTS "Only Ntsako can read" ON public.trade_history_log;
DROP POLICY IF EXISTS "Only Ntsako can insert" ON public.trade_history_log;

-- Add missing FK indexes (performance).
CREATE INDEX IF NOT EXISTS idx_ticklet_user_id ON public."Ticklet"(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);

-- Create missing tables for the new pipeline
CREATE TABLE IF NOT EXISTS public.signals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    symbol TEXT NOT NULL,
    signal_type TEXT NOT NULL,
    entry_price NUMERIC,
    confidence NUMERIC,
    ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID REFERENCES auth.users,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.scans (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    symbols_total INTEGER,
    passed_filters INTEGER,
    signals_count INTEGER,
    trades_opened INTEGER,
    duration_ms INTEGER,
    ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

-- Create policies for new tables
CREATE POLICY "signals_select" ON public.signals FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "signals_insert" ON public.signals FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "scans_select" ON public.scans FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "scans_insert" ON public.scans FOR INSERT TO anon, authenticated WITH CHECK (true);