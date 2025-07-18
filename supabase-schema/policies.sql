-- Row-Level Security (RLS) Policies for Ticklet Trading Bot
-- This file contains all RLS policies for user data isolation

-- Enable RLS on all user-specific tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backtest_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_learning_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_interactions ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own profile" ON public.user_profiles
    FOR DELETE USING (auth.uid() = id);

-- User Credentials Policies (highly secure)
CREATE POLICY "Users can view their own credentials" ON public.user_credentials
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credentials" ON public.user_credentials
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credentials" ON public.user_credentials
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own credentials" ON public.user_credentials
    FOR DELETE USING (auth.uid() = user_id);

-- Trading Signals Policies
CREATE POLICY "Users can view their own signals" ON public.trading_signals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own signals" ON public.trading_signals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own signals" ON public.trading_signals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own signals" ON public.trading_signals
    FOR DELETE USING (auth.uid() = user_id);

-- Bot Configurations Policies
CREATE POLICY "Users can view their own bot configs" ON public.bot_configurations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bot configs" ON public.bot_configurations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bot configs" ON public.bot_configurations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bot configs" ON public.bot_configurations
    FOR DELETE USING (auth.uid() = user_id);

-- Trades Policies
CREATE POLICY "Users can view their own trades" ON public.trades
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trades" ON public.trades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trades" ON public.trades
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trades" ON public.trades
    FOR DELETE USING (auth.uid() = user_id);

-- Backtest Results Policies
CREATE POLICY "Users can view their own backtest results" ON public.backtest_results
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own backtest results" ON public.backtest_results
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own backtest results" ON public.backtest_results
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own backtest results" ON public.backtest_results
    FOR DELETE USING (auth.uid() = user_id);

-- AI Learning Data Policies
CREATE POLICY "Users can view their own AI learning data" ON public.ai_learning_data
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI learning data" ON public.ai_learning_data
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI learning data" ON public.ai_learning_data
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI learning data" ON public.ai_learning_data
    FOR DELETE USING (auth.uid() = user_id);

-- Telegram Interactions Policies
CREATE POLICY "Users can view their own telegram interactions" ON public.telegram_interactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own telegram interactions" ON public.telegram_interactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own telegram interactions" ON public.telegram_interactions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own telegram interactions" ON public.telegram_interactions
    FOR DELETE USING (auth.uid() = user_id);

-- Additional security policies for service functions
-- Allow service role to access data for background processing
CREATE POLICY "Service role can access all data" ON public.trading_signals
    FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can access all trades" ON public.trades
    FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can access all AI learning data" ON public.ai_learning_data
    FOR ALL USING (current_setting('role') = 'service_role');

-- Anonymous access policies (for public endpoints if needed)
-- These can be uncommented if you need public access to certain data
-- CREATE POLICY "Allow anonymous read access to public signals" ON public.trading_signals
--     FOR SELECT USING (is_public = true);