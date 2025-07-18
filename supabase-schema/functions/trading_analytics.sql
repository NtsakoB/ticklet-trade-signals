-- Trading Analytics Functions for Ticklet Trading Bot
-- These functions calculate trading performance and analytics

-- Function to calculate user trading statistics
CREATE OR REPLACE FUNCTION public.calculate_trading_stats(
    p_user_id UUID,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL,
    p_trade_mode TEXT DEFAULT 'all' -- 'paper', 'live', 'all'
)
RETURNS TABLE(
    total_trades INTEGER,
    winning_trades INTEGER,
    losing_trades INTEGER,
    win_rate DECIMAL(5,2),
    total_pnl DECIMAL(20,8),
    total_pnl_percentage DECIMAL(10,4),
    best_trade DECIMAL(20,8),
    worst_trade DECIMAL(20,8),
    average_hold_time INTERVAL,
    profit_factor DECIMAL(10,4)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_start_date DATE;
    v_end_date DATE;
BEGIN
    -- Set default date range if not provided
    v_start_date := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '30 days');
    v_end_date := COALESCE(p_end_date, CURRENT_DATE);
    
    RETURN QUERY
    WITH trade_stats AS (
        SELECT 
            t.pnl,
            t.pnl_percentage,
            t.exit_time - t.entry_time as hold_time,
            CASE WHEN t.pnl > 0 THEN 1 ELSE 0 END as is_winning,
            CASE WHEN t.pnl < 0 THEN 1 ELSE 0 END as is_losing
        FROM public.trades t
        WHERE t.user_id = p_user_id
          AND t.status = 'closed'
          AND t.pnl IS NOT NULL
          AND DATE(t.entry_time) >= v_start_date
          AND DATE(t.entry_time) <= v_end_date
          AND (p_trade_mode = 'all' OR t.trade_mode = p_trade_mode)
    ),
    aggregated_stats AS (
        SELECT 
            COUNT(*)::INTEGER as total_trades,
            SUM(is_winning)::INTEGER as winning_trades,
            SUM(is_losing)::INTEGER as losing_trades,
            SUM(pnl) as total_pnl,
            AVG(pnl_percentage) as avg_pnl_percentage,
            MAX(pnl) as best_trade,
            MIN(pnl) as worst_trade,
            AVG(hold_time) as average_hold_time,
            SUM(CASE WHEN pnl > 0 THEN pnl ELSE 0 END) as gross_profit,
            ABS(SUM(CASE WHEN pnl < 0 THEN pnl ELSE 0 END)) as gross_loss
        FROM trade_stats
    )
    SELECT 
        a.total_trades,
        a.winning_trades,
        a.losing_trades,
        CASE 
            WHEN a.total_trades > 0 THEN ROUND((a.winning_trades::DECIMAL / a.total_trades::DECIMAL) * 100, 2)
            ELSE 0::DECIMAL(5,2)
        END as win_rate,
        a.total_pnl,
        a.avg_pnl_percentage,
        a.best_trade,
        a.worst_trade,
        a.average_hold_time,
        CASE 
            WHEN a.gross_loss > 0 THEN ROUND(a.gross_profit / a.gross_loss, 4)
            ELSE 0::DECIMAL(10,4)
        END as profit_factor
    FROM aggregated_stats a;
END;
$$;

-- Function to get trading performance by strategy
CREATE OR REPLACE FUNCTION public.get_strategy_performance(
    p_user_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE(
    strategy TEXT,
    total_trades INTEGER,
    win_rate DECIMAL(5,2),
    total_pnl DECIMAL(20,8),
    avg_confidence DECIMAL(5,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.strategy,
        COUNT(*)::INTEGER as total_trades,
        ROUND((SUM(CASE WHEN t.pnl > 0 THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 2) as win_rate,
        SUM(t.pnl) as total_pnl,
        AVG(t.confidence_score) as avg_confidence
    FROM public.trades t
    WHERE t.user_id = p_user_id
      AND t.status = 'closed'
      AND t.pnl IS NOT NULL
      AND t.strategy IS NOT NULL
      AND t.entry_time >= CURRENT_DATE - INTERVAL '1 day' * p_days
    GROUP BY t.strategy
    ORDER BY total_pnl DESC;
END;
$$;

-- Function to calculate maximum drawdown
CREATE OR REPLACE FUNCTION public.calculate_max_drawdown(
    p_user_id UUID,
    p_start_date DATE DEFAULT NULL
)
RETURNS DECIMAL(10,4)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_max_drawdown DECIMAL(10,4) := 0;
    v_peak DECIMAL(20,8) := 0;
    v_current_balance DECIMAL(20,8) := 0;
    v_start_date DATE;
    trade_record RECORD;
BEGIN
    v_start_date := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '30 days');
    
    -- Calculate running balance and track drawdown
    FOR trade_record IN
        SELECT pnl, entry_time
        FROM public.trades
        WHERE user_id = p_user_id
          AND status = 'closed'
          AND pnl IS NOT NULL
          AND DATE(entry_time) >= v_start_date
        ORDER BY entry_time ASC
    LOOP
        v_current_balance := v_current_balance + trade_record.pnl;
        
        -- Update peak if current balance is higher
        IF v_current_balance > v_peak THEN
            v_peak := v_current_balance;
        END IF;
        
        -- Calculate drawdown from peak
        IF v_peak > 0 THEN
            v_max_drawdown := GREATEST(v_max_drawdown, ((v_peak - v_current_balance) / v_peak) * 100);
        END IF;
    END LOOP;
    
    RETURN ROUND(v_max_drawdown, 4);
END;
$$;

-- Function to get recent signal performance
CREATE OR REPLACE FUNCTION public.get_recent_signal_performance(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
    signal_id UUID,
    symbol TEXT,
    strategy TEXT,
    confidence_score DECIMAL(5,2),
    predicted_direction TEXT,
    actual_outcome TEXT,
    accuracy_score DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id as signal_id,
        s.symbol,
        s.strategy,
        s.confidence_score,
        s.signal_type as predicted_direction,
        CASE 
            WHEN t.pnl > 0 THEN 'profitable'
            WHEN t.pnl < 0 THEN 'loss'
            WHEN t.pnl = 0 THEN 'breakeven'
            ELSE 'pending'
        END as actual_outcome,
        CASE 
            WHEN t.pnl IS NOT NULL THEN
                CASE 
                    WHEN (s.signal_type = 'BUY' AND t.pnl > 0) OR (s.signal_type = 'SELL' AND t.pnl > 0) THEN 100.0
                    WHEN t.pnl = 0 THEN 50.0
                    ELSE 0.0
                END
            ELSE NULL
        END as accuracy_score,
        s.created_at
    FROM public.trading_signals s
    LEFT JOIN public.trades t ON s.id = t.signal_id
    WHERE s.user_id = p_user_id
    ORDER BY s.created_at DESC
    LIMIT p_limit;
END;
$$;