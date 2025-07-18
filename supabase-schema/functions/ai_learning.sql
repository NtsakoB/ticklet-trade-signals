-- AI Learning Functions for Ticklet Trading Bot
-- These functions handle AI learning and improvement processes

-- Function to record AI learning data after trade completion
CREATE OR REPLACE FUNCTION public.record_ai_learning(
    p_user_id UUID,
    p_signal_id UUID,
    p_trade_id UUID,
    p_market_data JSONB,
    p_actual_outcome TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_learning_id UUID;
    v_signal_confidence DECIMAL(5,2);
    v_prediction_accuracy DECIMAL(5,2);
BEGIN
    -- Generate new learning record ID
    v_learning_id := uuid_generate_v4();
    
    -- Get the original signal confidence
    SELECT confidence_score INTO v_signal_confidence
    FROM public.trading_signals
    WHERE id = p_signal_id;
    
    -- Calculate prediction accuracy based on outcome
    v_prediction_accuracy := CASE 
        WHEN p_actual_outcome = 'profitable' THEN v_signal_confidence
        WHEN p_actual_outcome = 'breakeven' THEN v_signal_confidence * 0.5
        WHEN p_actual_outcome = 'loss' THEN 100 - v_signal_confidence
        ELSE 0
    END;
    
    -- Insert learning data
    INSERT INTO public.ai_learning_data (
        id,
        user_id,
        signal_id,
        trade_id,
        market_data,
        prediction_accuracy,
        actual_outcome,
        learning_feedback,
        created_at
    ) VALUES (
        v_learning_id,
        p_user_id,
        p_signal_id,
        p_trade_id,
        p_market_data,
        v_prediction_accuracy,
        p_actual_outcome,
        jsonb_build_object(
            'original_confidence', v_signal_confidence,
            'accuracy_score', v_prediction_accuracy,
            'learning_timestamp', NOW()
        ),
        NOW()
    );
    
    RETURN v_learning_id;
END;
$$;

-- Function to calculate AI model performance metrics
CREATE OR REPLACE FUNCTION public.calculate_ai_performance(
    p_user_id UUID,
    p_strategy TEXT DEFAULT NULL,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE(
    strategy TEXT,
    total_predictions INTEGER,
    accurate_predictions INTEGER,
    accuracy_rate DECIMAL(5,2),
    avg_confidence DECIMAL(5,2),
    confidence_calibration DECIMAL(5,2),
    improvement_trend DECIMAL(5,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH learning_stats AS (
        SELECT 
            s.strategy,
            COUNT(*) as total_predictions,
            SUM(CASE WHEN ald.prediction_accuracy >= 70 THEN 1 ELSE 0 END) as accurate_predictions,
            AVG(ald.prediction_accuracy) as avg_accuracy,
            AVG(s.confidence_score) as avg_confidence,
            -- Calculate confidence calibration (how well confidence matches accuracy)
            ABS(AVG(s.confidence_score) - AVG(ald.prediction_accuracy)) as confidence_diff,
            -- Calculate improvement trend (recent vs older performance)
            AVG(CASE WHEN ald.created_at >= CURRENT_DATE - INTERVAL '7 days' 
                THEN ald.prediction_accuracy ELSE NULL END) - 
            AVG(CASE WHEN ald.created_at < CURRENT_DATE - INTERVAL '7 days' 
                THEN ald.prediction_accuracy ELSE NULL END) as improvement_trend
        FROM public.ai_learning_data ald
        JOIN public.trading_signals s ON ald.signal_id = s.id
        WHERE ald.user_id = p_user_id
          AND ald.created_at >= CURRENT_DATE - INTERVAL '1 day' * p_days
          AND (p_strategy IS NULL OR s.strategy = p_strategy)
        GROUP BY s.strategy
    )
    SELECT 
        ls.strategy,
        ls.total_predictions::INTEGER,
        ls.accurate_predictions::INTEGER,
        ROUND((ls.accurate_predictions::DECIMAL / ls.total_predictions::DECIMAL) * 100, 2) as accuracy_rate,
        ROUND(ls.avg_confidence, 2) as avg_confidence,
        ROUND(100 - ls.confidence_diff, 2) as confidence_calibration,
        ROUND(COALESCE(ls.improvement_trend, 0), 2) as improvement_trend
    FROM learning_stats ls
    ORDER BY accuracy_rate DESC;
END;
$$;

-- Function to get AI learning insights and recommendations
CREATE OR REPLACE FUNCTION public.get_ai_insights(
    p_user_id UUID,
    p_symbol TEXT DEFAULT NULL
)
RETURNS TABLE(
    insight_type TEXT,
    insight_message TEXT,
    confidence_level TEXT,
    supporting_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_trades INTEGER;
    v_win_rate DECIMAL(5,2);
    v_avg_accuracy DECIMAL(5,2);
    v_best_strategy TEXT;
    v_worst_strategy TEXT;
BEGIN
    -- Get basic stats
    SELECT COUNT(*), 
           AVG(CASE WHEN actual_outcome = 'profitable' THEN 100 ELSE 0 END),
           AVG(prediction_accuracy)
    INTO v_total_trades, v_win_rate, v_avg_accuracy
    FROM public.ai_learning_data ald
    JOIN public.trading_signals s ON ald.signal_id = s.id
    WHERE ald.user_id = p_user_id
      AND (p_symbol IS NULL OR s.symbol = p_symbol)
      AND ald.created_at >= CURRENT_DATE - INTERVAL '30 days';
    
    -- Get best and worst performing strategies
    SELECT strategy INTO v_best_strategy
    FROM public.calculate_ai_performance(p_user_id, NULL, 30)
    ORDER BY accuracy_rate DESC
    LIMIT 1;
    
    SELECT strategy INTO v_worst_strategy
    FROM public.calculate_ai_performance(p_user_id, NULL, 30)
    ORDER BY accuracy_rate ASC
    LIMIT 1;
    
    -- Return insights
    RETURN QUERY
    SELECT 
        'performance_summary'::TEXT,
        format('AI model has %s%% accuracy with %s trades analyzed', 
               ROUND(v_avg_accuracy, 0), v_total_trades)::TEXT,
        CASE 
            WHEN v_avg_accuracy >= 70 THEN 'high'
            WHEN v_avg_accuracy >= 50 THEN 'medium'
            ELSE 'low'
        END::TEXT,
        jsonb_build_object(
            'total_trades', v_total_trades,
            'accuracy', v_avg_accuracy,
            'win_rate', v_win_rate
        )
    
    UNION ALL
    
    SELECT 
        'strategy_recommendation'::TEXT,
        format('Best performing strategy: %s. Consider focusing on this approach.', v_best_strategy)::TEXT,
        'medium'::TEXT,
        jsonb_build_object(
            'best_strategy', v_best_strategy,
            'worst_strategy', v_worst_strategy
        )
    
    UNION ALL
    
    SELECT 
        'improvement_suggestion'::TEXT,
        CASE 
            WHEN v_avg_accuracy < 50 THEN 'AI model needs more training data. Consider paper trading for more samples.'
            WHEN v_avg_accuracy < 70 THEN 'Model showing moderate performance. Review failed predictions for patterns.'
            ELSE 'Model performing well. Consider gradually increasing position sizes.'
        END::TEXT,
        'high'::TEXT,
        jsonb_build_object(
            'current_accuracy', v_avg_accuracy,
            'target_accuracy', 70,
            'data_sufficiency', v_total_trades >= 100
        );
END;
$$;

-- Function to update AI model parameters based on learning
CREATE OR REPLACE FUNCTION public.optimize_ai_parameters(
    p_user_id UUID,
    p_strategy TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_optimal_params JSONB;
    v_success_patterns JSONB;
    v_failure_patterns JSONB;
BEGIN
    -- Analyze successful predictions
    SELECT jsonb_agg(
        jsonb_build_object(
            'market_conditions', market_data->'conditions',
            'indicators', market_data->'indicators',
            'confidence', market_data->'confidence'
        )
    ) INTO v_success_patterns
    FROM public.ai_learning_data ald
    JOIN public.trading_signals s ON ald.signal_id = s.id
    WHERE ald.user_id = p_user_id
      AND s.strategy = p_strategy
      AND ald.actual_outcome = 'profitable'
      AND ald.prediction_accuracy >= 70
      AND ald.created_at >= CURRENT_DATE - INTERVAL '30 days';
    
    -- Analyze failed predictions
    SELECT jsonb_agg(
        jsonb_build_object(
            'market_conditions', market_data->'conditions',
            'indicators', market_data->'indicators',
            'confidence', market_data->'confidence'
        )
    ) INTO v_failure_patterns
    FROM public.ai_learning_data ald
    JOIN public.trading_signals s ON ald.signal_id = s.id
    WHERE ald.user_id = p_user_id
      AND s.strategy = p_strategy
      AND ald.actual_outcome = 'loss'
      AND ald.prediction_accuracy < 30
      AND ald.created_at >= CURRENT_DATE - INTERVAL '30 days';
    
    -- Build optimal parameters
    v_optimal_params := jsonb_build_object(
        'strategy', p_strategy,
        'success_patterns', COALESCE(v_success_patterns, '[]'::jsonb),
        'failure_patterns', COALESCE(v_failure_patterns, '[]'::jsonb),
        'optimization_timestamp', NOW(),
        'recommendations', jsonb_build_object(
            'min_confidence_threshold', 65,
            'preferred_market_conditions', 'trending',
            'risk_adjustment', 'conservative'
        )
    );
    
    RETURN v_optimal_params;
END;
$$;