-- Row-Level Security (RLS) Policies for Ticklet Trading Bot
-- This file contains all RLS policies for user data isolation

-- Enable RLS
alter table user_profiles enable row level security;
alter table user_credentials enable row level security;
alter table trading_signals enable row level security;
alter table bot_configurations enable row level security;

-- User Profiles Policies
create policy "User can manage their own profile"
on user_profiles
for all
using (id = auth.uid());

-- Credentials access control
create policy "User can manage their own credentials"
on user_credentials
for all
using (user_id = auth.uid());

-- Signals access control
create policy "User can access their own trading signals"
on trading_signals
for all
using (user_id = auth.uid());

-- Bot config access control
create policy "User can access their own bot configuration"
on bot_configurations
for all
using (user_id = auth.uid());