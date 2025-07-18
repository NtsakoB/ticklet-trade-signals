-- Sample Data for Ticklet Trading Bot Development and Testing
-- This file contains sample/dummy data for development and testing purposes

-- Sample user profiles (using placeholder UUIDs - replace with actual auth.users IDs)
-- Note: These UUIDs are for development only and should be replaced with real user IDs

-- Sample bot configurations
INSERT INTO public.bot_configurations (
    id,
    user_id,
    config_name,
    is_active,
    trading_mode,
    max_open_trades,
    risk_per_trade,
    leverage,
    dynamic_leverage,
    auto_trading,
    telegram_notifications,
    strategies_enabled
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440000', -- Replace with actual user ID
    'Conservative Trading',
    true,
    'paper',
    3,
    1.5,
    5,
    false,
    false,
    true,
    ARRAY['swing', 'momentum']
),
(
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440000', -- Replace with actual user ID
    'Aggressive Scalping',
    false,
    'paper',
    10,
    3.0,
    20,
    true,
    true,
    true,
    ARRAY['scalping', 'momentum']
);

-- Sample trading signals
INSERT INTO public.trading_signals (
    id,
    user_id,
    symbol,
    signal_type,
    strategy,
    confidence_score,
    entry_price,
    suggested_entry_min,
    suggested_entry_max,
    stop_loss,
    take_profit_1,
    take_profit_2,
    take_profit_3,
    market_condition,
    technical_indicators,
    ai_analysis,
    is_actionable,
    created_at
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440010',
    '550e8400-e29b-41d4-a716-446655440000', -- Replace with actual user ID
    'BTCUSDT',
    'BUY',
    'momentum',
    75.5,
    42500.00,
    42200.00,
    42800.00,
    41000.00,
    44000.00,
    45500.00,
    47000.00,
    'bullish',
    jsonb_build_object(
        'rsi', 65.2,
        'macd', 'bullish_crossover',
        'volume', 'above_average',
        'support', 41500.00,
        'resistance', 44200.00
    ),
    jsonb_build_object(
        'reasoning', 'Strong momentum with RSI in favorable zone',
        'market_sentiment', 'positive',
        'risk_level', 'medium',
        'expected_move', '5-7%'
    ),
    true,
    NOW() - INTERVAL '2 hours'
),
(
    '550e8400-e29b-41d4-a716-446655440011',
    '550e8400-e29b-41d4-a716-446655440000', -- Replace with actual user ID
    'ETHUSDT',
    'SELL',
    'swing',
    68.3,
    2850.00,
    2880.00,
    2820.00,
    2950.00,
    2750.00,
    2650.00,
    2550.00,
    'bearish',
    jsonb_build_object(
        'rsi', 72.8,
        'macd', 'bearish_divergence',
        'volume', 'decreasing',
        'support', 2700.00,
        'resistance', 2900.00
    ),
    jsonb_build_object(
        'reasoning', 'Overbought conditions with weakening momentum',
        'market_sentiment', 'cautious',
        'risk_level', 'medium',
        'expected_move', '3-5%'
    ),
    true,
    NOW() - INTERVAL '4 hours'
);

-- Sample trades (some completed, some open)
INSERT INTO public.trades (
    id,
    user_id,
    signal_id,
    symbol,
    trade_type,
    entry_price,
    exit_price,
    quantity,
    leverage,
    entry_time,
    exit_time,
    pnl,
    pnl_percentage,
    status,
    trade_mode,
    strategy,
    confidence_score
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440020',
    '550e8400-e29b-41d4-a716-446655440000', -- Replace with actual user ID
    '550e8400-e29b-41d4-a716-446655440010',
    'BTCUSDT',
    'BUY',
    42650.00,
    43850.00,
    0.1,
    10,
    NOW() - INTERVAL '6 hours',
    NOW() - INTERVAL '2 hours',
    120.00,
    2.81,
    'closed',
    'paper',
    'momentum',
    75.5
),
(
    '550e8400-e29b-41d4-a716-446655440021',
    '550e8400-e29b-41d4-a716-446655440000', -- Replace with actual user ID
    '550e8400-e29b-41d4-a716-446655440011',
    'ETHUSDT',
    'SELL',
    2865.00,
    NULL,
    0.5,
    5,
    NOW() - INTERVAL '3 hours',
    NULL,
    NULL,
    NULL,
    'open',
    'paper',
    'swing',
    68.3
);

-- Sample backtest results
INSERT INTO public.backtest_results (
    id,
    user_id,
    strategy,
    symbol,
    timeframe,
    start_date,
    end_date,
    initial_balance,
    final_balance,
    total_return,
    total_trades,
    winning_trades,
    losing_trades,
    win_rate,
    max_drawdown,
    sharpe_ratio,
    profit_factor,
    results_data
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440030',
    '550e8400-e29b-41d4-a716-446655440000', -- Replace with actual user ID
    'momentum',
    'BTCUSDT',
    '1h',
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE - INTERVAL '1 day',
    10000.00,
    11250.00,
    12.50,
    45,
    28,
    17,
    62.22,
    8.5,
    1.45,
    1.8,
    jsonb_build_object(
        'monthly_returns', ARRAY[2.5, 3.1, -1.2, 4.8, 3.3],
        'trade_distribution', jsonb_build_object(
            'small_wins', 15,
            'medium_wins', 10,
            'large_wins', 3,
            'small_losses', 12,
            'medium_losses', 4,
            'large_losses', 1
        ),
        'best_trade_pnl', 450.00,
        'worst_trade_pnl', -180.00
    )
);

-- Sample AI learning data
INSERT INTO public.ai_learning_data (
    id,
    user_id,
    signal_id,
    trade_id,
    market_data,
    prediction_accuracy,
    actual_outcome,
    learning_feedback
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440040',
    '550e8400-e29b-41d4-a716-446655440000', -- Replace with actual user ID
    '550e8400-e29b-41d4-a716-446655440010',
    '550e8400-e29b-41d4-a716-446655440020',
    jsonb_build_object(
        'price_at_signal', 42500.00,
        'volume_24h', 28500000000,
        'market_cap_rank', 1,
        'fear_greed_index', 65,
        'technical_indicators', jsonb_build_object(
            'rsi_14', 65.2,
            'macd_signal', 'bullish',
            'bb_position', 'upper_middle',
            'volume_sma_ratio', 1.15
        )
    ),
    78.5,
    'profitable',
    jsonb_build_object(
        'accuracy_improvement', 3.0,
        'confidence_calibration', 'good',
        'pattern_recognition', 'momentum_breakout_confirmed',
        'market_regime', 'trending_up'
    )
);

-- Sample Telegram interactions
INSERT INTO public.telegram_interactions (
    id,
    user_id,
    telegram_user_id,
    message_type,
    message_content,
    bot_response
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440050',
    '550e8400-e29b-41d4-a716-446655440000', -- Replace with actual user ID
    123456789,
    'command',
    '/status',
    'Bot Status: Active | Paper Trading Mode | 2 Open Positions | Daily P&L: +$85.50'
),
(
    '550e8400-e29b-41d4-a716-446655440051',
    '550e8400-e29b-41d4-a716-446655440000', -- Replace with actual user ID
    123456789,
    'signal',
    'New BUY signal for BTCUSDT at $42,500',
    'Signal received and processed. Confidence: 75.5%. Action: Added to watchlist.'
);

-- Note: In production, remember to:
-- 1. Replace placeholder UUIDs with actual auth.users IDs
-- 2. Update user_credentials with real encrypted API keys using the store_user_credential function
-- 3. Adjust sample data to match your actual trading requirements
-- 4. Consider using more realistic price data and market conditions