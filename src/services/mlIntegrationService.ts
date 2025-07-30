import { supabase } from '@/integrations/supabase/client';

interface MLTrainingData {
  symbol: string;
  strategy: string;
  confidence: number;
  entry_price: number;
  outcome: 'tp1' | 'tp2' | 'tp3' | 'sl' | 'open';
  pnl: number;
  trade_duration: number;
  timestamp: string;
}

class MLIntegrationService {
  private static instance: MLIntegrationService;
  private trainingQueue: MLTrainingData[] = [];
  private batchSize = 10;
  private lastSync = Date.now();

  static getInstance(): MLIntegrationService {
    if (!MLIntegrationService.instance) {
      MLIntegrationService.instance = new MLIntegrationService();
    }
    return MLIntegrationService.instance;
  }

  /**
   * Add a completed trade to the ML training queue
   */
  async queueTradeForML(tradeData: MLTrainingData) {
    console.log('Queueing trade for ML training:', tradeData);
    this.trainingQueue.push(tradeData);
    
    // Process batch if we have enough data or it's been too long
    if (this.trainingQueue.length >= this.batchSize || 
        Date.now() - this.lastSync > 300000) { // 5 minutes
      await this.processBatch();
    }
  }

  /**
   * Send batch of trades to ML model for retraining
   */
  private async processBatch() {
    if (this.trainingQueue.length === 0) return;

    try {
      console.log(`Processing ML batch of ${this.trainingQueue.length} trades`);
      
      // Call the ML learning edge function
      const { data, error } = await supabase.functions.invoke('learning-entries', {
        body: {
          action: 'batch_trade_feedback',
          trades: this.trainingQueue,
          strategy: 'adaptive_learning',
          timestamp: new Date().toISOString()
        }
      });

      if (error) {
        console.error('ML batch processing failed:', error);
        return;
      }

      console.log('ML batch processed successfully:', data);
      
      // Clear the queue on success
      this.trainingQueue = [];
      this.lastSync = Date.now();

    } catch (error) {
      console.error('Error processing ML batch:', error);
    }
  }

  /**
   * Process trade completion and trigger ML learning
   */
  async onTradeCompleted(tradeId: string) {
    try {
      // Fetch the completed trade
      const { data: trade, error } = await supabase
        .from('trade_history_log')
        .select('*')
        .eq('id', tradeId)
        .single();

      if (error || !trade) {
        console.error('Failed to fetch trade for ML processing:', error);
        return;
      }

      // Determine outcome
      let outcome: 'tp1' | 'tp2' | 'tp3' | 'sl' | 'open' = 'open';
      if (trade.tp3_hit) outcome = 'tp3';
      else if (trade.tp2_hit) outcome = 'tp2';
      else if (trade.tp1_hit) outcome = 'tp1';
      else if (trade.stop_loss_hit) outcome = 'sl';

      // Queue for ML training
      await this.queueTradeForML({
        symbol: trade.symbol,
        strategy: trade.strategy,
        confidence: trade.confidence || 0,
        entry_price: trade.entry_price || 0,
        outcome,
        pnl: trade.pnl || 0,
        trade_duration: trade.trade_duration || 0,
        timestamp: trade.created_at
      });

      // Update strategy performance metrics
      await this.updateStrategyMetrics(trade.strategy);

    } catch (error) {
      console.error('Error in ML trade completion handler:', error);
    }
  }

  /**
   * Update strategy-specific performance metrics for ML
   */
  private async updateStrategyMetrics(strategy: string) {
    try {
      console.log(`Updating strategy metrics for: ${strategy}`);
      
      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.error('No authenticated user for strategy metrics update');
        return;
      }

      // Call the trades-summary function to get calculated metrics
      const { data: summary, error } = await supabase.functions.invoke('trades-summary', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      });

      if (error) {
        console.error('Error fetching strategy summary:', error);
        return;
      }

      // Find metrics for the specific strategy
      const strategyMetrics = summary?.by_strategy?.find((s: any) => s.strategy === strategy);
      
      if (strategyMetrics) {
        console.log(`Strategy ${strategy} metrics:`, {
          totalTrades: strategyMetrics.total_trades,
          winRate: strategyMetrics.win_rate.toFixed(2),
          avgPnl: strategyMetrics.avg_pnl.toFixed(2),
          avgConfidence: strategyMetrics.avg_confidence.toFixed(2)
        });

        // Store updated metrics in learning entries for AI tracking
        await supabase.from('learning_entries').insert({
          user_id: session.user.id,
          strategy: strategy,
          instruction: 'Strategy metrics update',
          response: JSON.stringify(strategyMetrics),
          context: {
            type: 'strategy_metrics',
            timestamp: new Date().toISOString(),
            metrics: strategyMetrics
          }
        });

        // Send to ML retrain endpoint if strategy has enough trades
        if (strategyMetrics.total_trades >= 50) {
          await supabase.functions.invoke('ml-retrain', {
            body: {
              user_id: session.user.id,
              strategy: strategy,
              trigger: 'strategy_metrics_update'
            },
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            }
          });
        }
      }
      
    } catch (error) {
      console.error('Error updating strategy metrics:', error);
    }
  }

  /**
   * Force process any pending ML training data
   */
  async flushPendingTraining() {
    if (this.trainingQueue.length > 0) {
      await this.processBatch();
    }
  }

  /**
   * Get ML training queue status
   */
  getQueueStatus() {
    return {
      pending: this.trainingQueue.length,
      lastSync: new Date(this.lastSync).toISOString(),
      batchSize: this.batchSize
    };
  }
}

export default MLIntegrationService;