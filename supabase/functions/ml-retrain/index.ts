import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MLTrainingData {
  symbol: string;
  strategy: string;
  confidence: number;
  entry_price: number;
  pnl: number;
  trade_duration: number;
  outcome: 'win' | 'loss';
  timestamp: string;
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

    const { user_id, trigger } = await req.json();
    console.log(`ML Retrain triggered for user: ${user_id}, trigger: ${trigger}`)

    // Fetch user's trade history for training
    const { data: trades, error: tradesError } = await supabaseClient
      .from('trade_history_log')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(1000); // Get last 1000 trades for training

    if (tradesError) {
      console.error('Error fetching trades:', tradesError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch trade data' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!trades || trades.length < 10) {
      console.log('Insufficient trade data for training')
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Need at least 10 trades for training' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Transform trades to ML training format
    const trainingData: MLTrainingData[] = trades.map(trade => ({
      symbol: trade.symbol,
      strategy: trade.strategy,
      confidence: trade.confidence || 0,
      entry_price: trade.entry_price || 0,
      pnl: trade.pnl || 0,
      trade_duration: trade.trade_duration || 0,
      outcome: (trade.tp1_hit || trade.tp2_hit || trade.tp3_hit) ? 'win' : 'loss',
      timestamp: trade.created_at
    }));

    // Store training data in learning_entries table
    const { error: learningError } = await supabaseClient
      .from('learning_entries')
      .insert({
        user_id: user_id,
        strategy: 'ml_retrain',
        instruction: `Auto ML retrain triggered by ${trigger}`,
        response: `Processed ${trainingData.length} trades for retraining`,
        context: {
          training_data_count: trainingData.length,
          win_rate: trainingData.filter(t => t.outcome === 'win').length / trainingData.length,
          trigger_type: trigger,
          strategies: [...new Set(trainingData.map(t => t.strategy))]
        }
      });

    if (learningError) {
      console.error('Error storing learning entry:', learningError)
    }

    // Calculate and store accuracy snapshot
    const winRate = trainingData.filter(t => t.outcome === 'win').length / trainingData.length;
    const accuracyCurve = calculateAccuracyCurve(trainingData);

    const { error: snapshotError } = await supabaseClient
      .from('accuracy_snapshots')
      .insert({
        strategy: 'ml_retrain',
        max_accuracy: Math.max(...accuracyCurve),
        min_accuracy: Math.min(...accuracyCurve),
        accuracy_curve: accuracyCurve,
        curve_length: accuracyCurve.length
      });

    if (snapshotError) {
      console.error('Error storing accuracy snapshot:', snapshotError)
    }

    console.log(`ML Retrain completed for user ${user_id}: ${trainingData.length} trades processed`)

    return new Response(
      JSON.stringify({
        success: true,
        trades_processed: trainingData.length,
        win_rate: winRate,
        accuracy_range: {
          min: Math.min(...accuracyCurve),
          max: Math.max(...accuracyCurve)
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('ML Retrain error:', error)
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

function calculateAccuracyCurve(trades: MLTrainingData[]): number[] {
  const curve: number[] = [];
  let cumulativeWins = 0;
  
  for (let i = 0; i < trades.length; i++) {
    if (trades[i].outcome === 'win') {
      cumulativeWins++;
    }
    const accuracy = cumulativeWins / (i + 1);
    curve.push(accuracy);
  }
  
  return curve;
}