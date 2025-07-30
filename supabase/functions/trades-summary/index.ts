import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TradeSummary {
  strategy: string;
  total_trades: number;
  win_rate: number;
  avg_pnl: number;
  total_pnl: number;
  avg_duration: number;
  avg_confidence: number;
  tp1_hits: number;
  tp2_hits: number;
  tp3_hits: number;
  stop_loss_hits: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user from JWT
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !user) {
      console.error('Authentication error:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Fetching trade summary for user:', user.id)

    // Fetch all trades for the user
    const { data: trades, error: tradesError } = await supabaseClient
      .from('trade_history_log')
      .select('*')
      .eq('user_id', user.id)

    if (tradesError) {
      console.error('Database error:', tradesError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch trades' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Group trades by strategy and calculate metrics
    const strategyMap = new Map<string, any[]>();
    
    trades?.forEach(trade => {
      const strategy = trade.strategy || 'unknown';
      if (!strategyMap.has(strategy)) {
        strategyMap.set(strategy, []);
      }
      strategyMap.get(strategy)!.push(trade);
    });

    const summaries: TradeSummary[] = [];

    for (const [strategy, strategyTrades] of strategyMap) {
      const totalTrades = strategyTrades.length;
      const winningTrades = strategyTrades.filter(t => 
        t.tp1_hit || t.tp2_hit || t.tp3_hit
      );
      const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
      
      const totalPnl = strategyTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const avgPnl = totalTrades > 0 ? totalPnl / totalTrades : 0;
      
      const totalDuration = strategyTrades.reduce((sum, t) => sum + (t.trade_duration || 0), 0);
      const avgDuration = totalTrades > 0 ? totalDuration / totalTrades : 0;
      
      const totalConfidence = strategyTrades.reduce((sum, t) => sum + (t.confidence || 0), 0);
      const avgConfidence = totalTrades > 0 ? totalConfidence / totalTrades : 0;
      
      const tp1Hits = strategyTrades.filter(t => t.tp1_hit).length;
      const tp2Hits = strategyTrades.filter(t => t.tp2_hit).length;
      const tp3Hits = strategyTrades.filter(t => t.tp3_hit).length;
      const stopLossHits = strategyTrades.filter(t => t.stop_loss_hit).length;

      summaries.push({
        strategy,
        total_trades: totalTrades,
        win_rate: winRate,
        avg_pnl: avgPnl,
        total_pnl: totalPnl,
        avg_duration: avgDuration,
        avg_confidence: avgConfidence,
        tp1_hits: tp1Hits,
        tp2_hits: tp2Hits,
        tp3_hits: tp3Hits,
        stop_loss_hits: stopLossHits,
      });
    }

    // Calculate overall summary
    const overallSummary = {
      total_trades: trades?.length || 0,
      total_strategies: summaries.length,
      win_rate: summaries.length > 0 
        ? summaries.reduce((sum, s) => sum + s.win_rate * s.total_trades, 0) / (trades?.length || 1)
        : 0,
      total_pnl: summaries.reduce((sum, s) => sum + s.total_pnl, 0),
      avg_pnl: summaries.length > 0 
        ? summaries.reduce((sum, s) => sum + s.avg_pnl * s.total_trades, 0) / (trades?.length || 1)
        : 0,
    };

    console.log('Trade summary calculated:', { 
      strategies: summaries.length, 
      totalTrades: trades?.length || 0 
    })

    return new Response(
      JSON.stringify({
        overall: overallSummary,
        by_strategy: summaries.sort((a, b) => b.total_trades - a.total_trades)
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})