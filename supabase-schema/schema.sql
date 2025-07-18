-- Ticklet Trading Bot Database Schema
-- This file contains all database tables and structure for the trading bot

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User profiles table (extends Supabase auth.users)
create table user_profiles (
  id uuid references auth.users not null primary key,
  display_name text,
  avatar_url text,
  trading_preferences jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- User credentials and API keys (encrypted storage)
create table user_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  credential_type text check (credential_type in ('binance_api', 'telegram_bot', 'other')),
  encrypted_key text not null,
  encrypted_secret text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Trading signals and recommendations
create table trading_signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  symbol text,
  signal_type text check (signal_type in ('BUY', 'SELL')),
  entry_price numeric,
  stop_loss numeric,
  take_profits numeric[],
  anomaly_score numeric,
  strategy_used text,
  telegram_sent boolean default false,
  created_at timestamptz default now()
);

-- Bot configurations and settings
create table bot_configurations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  max_risk_per_trade numeric,
  max_open_trades integer,
  preferred_strategies text[],
  telegram_chat_id text,
  is_active boolean default true,
  created_at timestamptz default now()
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