-- Ticklet Trading Bot Database Schema
-- This file contains all database tables and structure for the trading bot

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    timezone TEXT DEFAULT 'UTC',
    preferred_currency TEXT DEFAULT 'USDT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User credentials and API keys (encrypted storage)
CREATE TABLE IF NOT EXISTS public.user_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    provider TEXT NOT NULL, -- 'binance', 'telegram', 'openai', etc.
    credential_type TEXT NOT NULL, -- 'api_key', 'secret_key', 'token', etc.
    encrypted_value TEXT NOT NULL, -- PGP encrypted credentials
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, provider, credential_type)
);

-- Trading signals and recommendations
CREATE TABLE IF NOT EXISTS public.trading_signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    signal_type TEXT NOT NULL, -- 'BUY', 'SELL', 'HOLD', 'WAIT'
    strategy TEXT NOT NULL, -- 'scalping', 'swing', 'momentum'
    confidence_score DECIMAL(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
    entry_price DECIMAL(20,8),
    suggested_entry_min DECIMAL(20,8),
    suggested_entry_max DECIMAL(20,8),
    stop_loss DECIMAL(20,8),
    take_profit_1 DECIMAL(20,8),
    take_profit_2 DECIMAL(20,8),
    take_profit_3 DECIMAL(20,8),
    market_condition TEXT, -- 'bullish', 'bearish', 'sideways'
    technical_indicators JSONB, -- RSI, MACD, volume, etc.
    ai_analysis JSONB, -- AI-generated insights and reasoning
    is_actionable BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Bot configurations and settings
CREATE TABLE IF NOT EXISTS public.bot_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    config_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    trading_mode TEXT DEFAULT 'paper', -- 'paper', 'live'
    max_open_trades INTEGER DEFAULT 5,
    risk_per_trade DECIMAL(5,2) DEFAULT 2.0, -- percentage
    leverage INTEGER DEFAULT 10,
    dynamic_leverage BOOLEAN DEFAULT false,
    auto_trading BOOLEAN DEFAULT false,
    telegram_notifications BOOLEAN DEFAULT true,
    strategies_enabled TEXT[] DEFAULT ARRAY['scalping', 'swing'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, config_name)
);

-- Trading history and performance
CREATE TABLE IF NOT EXISTS public.trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    signal_id UUID REFERENCES public.trading_signals(id),
    symbol TEXT NOT NULL,
    trade_type TEXT NOT NULL, -- 'BUY', 'SELL'
    entry_price DECIMAL(20,8) NOT NULL,
    exit_price DECIMAL(20,8),
    quantity DECIMAL(20,8) NOT NULL,
    leverage INTEGER DEFAULT 1,
    entry_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    exit_time TIMESTAMP WITH TIME ZONE,
    pnl DECIMAL(20,8),
    pnl_percentage DECIMAL(10,4),
    status TEXT DEFAULT 'open', -- 'open', 'closed', 'cancelled'
    trade_mode TEXT DEFAULT 'paper', -- 'paper', 'live'
    strategy TEXT,
    confidence_score DECIMAL(5,2),
    fees DECIMAL(20,8) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Backtest results storage
CREATE TABLE IF NOT EXISTS public.backtest_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    strategy TEXT NOT NULL,
    symbol TEXT,
    timeframe TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    initial_balance DECIMAL(20,8) NOT NULL,
    final_balance DECIMAL(20,8) NOT NULL,
    total_return DECIMAL(10,4),
    total_trades INTEGER,
    winning_trades INTEGER,
    losing_trades INTEGER,
    win_rate DECIMAL(5,2),
    max_drawdown DECIMAL(10,4),
    sharpe_ratio DECIMAL(10,4),
    profit_factor DECIMAL(10,4),
    results_data JSONB, -- detailed trade-by-trade results
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI learning and performance tracking
CREATE TABLE IF NOT EXISTS public.ai_learning_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    signal_id UUID REFERENCES public.trading_signals(id),
    trade_id UUID REFERENCES public.trades(id),
    market_data JSONB NOT NULL, -- price, volume, indicators at signal time
    prediction_accuracy DECIMAL(5,2),
    actual_outcome TEXT, -- 'profitable', 'loss', 'breakeven'
    learning_feedback JSONB, -- what the AI learned from this trade
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Telegram bot interactions
CREATE TABLE IF NOT EXISTS public.telegram_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    telegram_user_id BIGINT,
    message_type TEXT NOT NULL, -- 'signal', 'command', 'alert'
    message_content TEXT,
    bot_response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trading_signals_user_id ON public.trading_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_signals_symbol ON public.trading_signals(symbol);
CREATE INDEX IF NOT EXISTS idx_trading_signals_created_at ON public.trading_signals(created_at);
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON public.trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON public.trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_status ON public.trades(status);
CREATE INDEX IF NOT EXISTS idx_user_credentials_user_id ON public.user_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_configurations_user_id ON public.bot_configurations(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_credentials_updated_at
    BEFORE UPDATE ON public.user_credentials
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bot_configurations_updated_at
    BEFORE UPDATE ON public.bot_configurations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();