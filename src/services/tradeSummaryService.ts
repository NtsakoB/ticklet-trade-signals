import { supabase } from '@/integrations/supabase/client';

export interface TradeSummaryData {
  strategy: string;
  total_trades: number;
  win_rate: number;
  avg_pnl: number;
  avg_confidence: number;
  avg_duration: number;
}

export interface OverallSummary {
  total_trades: number;
  total_strategies: number;
  win_rate: number;
  total_pnl: number;
  avg_pnl: number;
}

export interface TradeSummaryResponse {
  overall: OverallSummary;
  by_strategy: TradeSummaryData[];
}

class TradeSummaryService {
  /**
   * Get comprehensive trade summary using the trades-summary edge function
   */
  async getTradeSummary(): Promise<TradeSummaryResponse | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.error('No authenticated user for trade summary');
        return null;
      }

      const { data, error } = await supabase.functions.invoke('trades-summary', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      });

      if (error) {
        console.error('Error fetching trade summary:', error);
        return null;
      }

      return data as TradeSummaryResponse;
    } catch (error) {
      console.error('Error in getTradeSummary:', error);
      return null;
    }
  }

  /**
   * Get summary for a specific strategy
   */
  async getStrategySummary(strategy: string): Promise<TradeSummaryData | null> {
    try {
      const summary = await this.getTradeSummary();
      if (!summary) return null;

      return summary.by_strategy.find(s => s.strategy === strategy) || null;
    } catch (error) {
      console.error('Error getting strategy summary:', error);
      return null;
    }
  }

  /**
   * Get top performing strategies by win rate
   */
  async getTopStrategies(limit: number = 5): Promise<TradeSummaryData[]> {
    try {
      const summary = await this.getTradeSummary();
      if (!summary) return [];

      return summary.by_strategy
        .filter(s => s.total_trades >= 10) // Only strategies with meaningful data
        .sort((a, b) => b.win_rate - a.win_rate)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting top strategies:', error);
      return [];
    }
  }

  /**
   * Get trade count progress toward next ML retrain (50 trades)
   */
  async getRetrainProgress(): Promise<{ current: number; target: number; percentage: number } | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;

      const { data: counter, error } = await supabase
        .from('user_trade_counters')
        .select('trade_count')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching retrain progress:', error);
        return null;
      }

      const current = counter?.trade_count || 0;
      const target = 50;
      const percentage = (current / target) * 100;

      return { current, target, percentage };
    } catch (error) {
      console.error('Error getting retrain progress:', error);
      return null;
    }
  }

  /**
   * Manually trigger ML retraining
   */
  async triggerManualRetrain(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.error('No authenticated user for manual retrain');
        return false;
      }

      const { error } = await supabase.functions.invoke('ml-retrain', {
        body: {
          user_id: session.user.id,
          trigger: 'manual_trigger'
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      });

      if (error) {
        console.error('Error triggering manual retrain:', error);
        return false;
      }

      console.log('Manual ML retrain triggered successfully');
      return true;
    } catch (error) {
      console.error('Error in triggerManualRetrain:', error);
      return false;
    }
  }
}

export const tradeSummaryService = new TradeSummaryService();