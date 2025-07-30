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
      // Get recent trades for this strategy (last 100)
      const { data: recentTrades } = await supabase
        .from('trade_history_log')
        .select('*')
        .eq('strategy', strategy)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!recentTrades?.length) return;

      // Calculate performance metrics
      const winningTrades = recentTrades.filter(t => 
        t.tp1_hit || t.tp2_hit || t.tp3_hit
      );
      
      const winRate = winningTrades.length / recentTrades.length;
      const avgPnL = recentTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / recentTrades.length;
      const avgConfidence = recentTrades.reduce((sum, t) => sum + (t.confidence || 0), 0) / recentTrades.length;

      // Send strategy performance to ML model
      await supabase.functions.invoke('learning-entries', {
        body: {
          action: 'strategy_performance_update',
          strategy,
          metrics: {
            win_rate: winRate,
            avg_pnl: avgPnL,
            avg_confidence: avgConfidence,
            trade_count: recentTrades.length
          },
          timestamp: new Date().toISOString()
        }
      });

      console.log(`Updated ML strategy metrics for ${strategy}:`, {
        winRate: (winRate * 100).toFixed(1) + '%',
        avgPnL: avgPnL.toFixed(2),
        avgConfidence: (avgConfidence * 100).toFixed(1) + '%'
      });

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