import { TradeSignal } from '../types';

export interface SignalRecord {
  symbol: string;
  entry: number;
  targets: number[];
  hitPrice: number;
  high?: number;
  low?: number;
  outcome: 'TP1' | 'TP2' | 'TP3' | 'SL' | 'Neutral';
  impactScore: number;
  confidence?: number;
  mlScore?: number;
  durationMins?: number;
  executed: boolean;
  timestamp: string;
  signalType: 'long' | 'short';
}

export interface LearningData {
  [mode: string]: {
    [symbol: string]: SignalRecord[];
  };
}

export interface LearningCurveData {
  mode: string;
  outcomes: Record<string, number>;
  totalSignals: number;
  winRate: number;
  avgImpactScore: number;
}

class SignalLearningTracker {
  private static LEARNING_DATA_KEY = 'signal_learning_data';

  private loadData(): LearningData {
    const stored = localStorage.getItem(SignalLearningTracker.LEARNING_DATA_KEY);
    return stored ? JSON.parse(stored) : {};
  }

  private saveData(data: LearningData): void {
    localStorage.setItem(SignalLearningTracker.LEARNING_DATA_KEY, JSON.stringify(data));
  }

  /**
   * Logs a signal for learning analysis
   */
  logSignal(params: {
    symbol: string;
    signalType: 'long' | 'short';
    entry: number;
    targets: number[];
    hitPrice: number;
    mode: 'backtest' | 'paper' | 'live' | 'signal';
    timestamp?: string;
    high?: number;
    low?: number;
    confidence?: number;
    mlScore?: number;
    durationMins?: number;
    tradeExecuted?: boolean;
  }): void {
    const {
      symbol,
      signalType,
      entry,
      targets,
      hitPrice,
      mode,
      timestamp = new Date().toISOString(),
      high,
      low,
      confidence,
      mlScore,
      durationMins,
      tradeExecuted = false,
    } = params;

    const { outcome, impactScore } = this.evaluateSignal(
      signalType,
      entry,
      targets,
      hitPrice,
      high,
      low,
      confidence,
      mlScore
    );

    const record: SignalRecord = {
      symbol,
      entry,
      targets,
      hitPrice,
      high,
      low,
      outcome,
      impactScore,
      confidence,
      mlScore,
      durationMins,
      executed: tradeExecuted,
      timestamp,
      signalType,
    };

    const data = this.loadData();
    if (!data[mode]) {
      data[mode] = {};
    }
    if (!data[mode][symbol]) {
      data[mode][symbol] = [];
    }

    data[mode][symbol].push(record);
    this.saveData(data);

    console.log(`[SignalTracker] Logged ${signalType} signal for ${symbol} in ${mode} mode: ${outcome}`);
  }

  /**
   * Evaluates signal quality and returns outcome with impact score
   */
  private evaluateSignal(
    signalType: 'long' | 'short',
    entry: number,
    targets: number[],
    hitPrice: number,
    high?: number,
    low?: number,
    confidence?: number,
    mlScore?: number
  ): { outcome: SignalRecord['outcome']; impactScore: number } {
    const scoreImpact = (price: number, ref: number): number => {
      return Math.abs(price - ref) / ref;
    };

    let impactScore = 0.0;
    let outcome: SignalRecord['outcome'] = 'Neutral';

    if (signalType === 'long') {
      if (high && high >= targets[2]) {
        outcome = 'TP3';
        impactScore = scoreImpact(high, entry);
      } else if (high && high >= targets[1]) {
        outcome = 'TP2';
        impactScore = scoreImpact(high, entry);
      } else if (high && high >= targets[0]) {
        outcome = 'TP1';
        impactScore = scoreImpact(high, entry);
      } else if (low && low <= entry * 0.9) {
        outcome = 'SL';
        impactScore = scoreImpact(entry * 0.9, entry);
      }
    } else if (signalType === 'short') {
      if (low && low <= targets[2]) {
        outcome = 'TP3';
        impactScore = scoreImpact(entry, low);
      } else if (low && low <= targets[1]) {
        outcome = 'TP2';
        impactScore = scoreImpact(entry, low);
      } else if (low && low <= targets[0]) {
        outcome = 'TP1';
        impactScore = scoreImpact(entry, low);
      } else if (high && high >= entry * 1.1) {
        outcome = 'SL';
        impactScore = scoreImpact(high, entry);
      }
    }

    // AI weight fusion
    if (confidence || mlScore) {
      let rawScore = impactScore;
      if (confidence) {
        rawScore *= confidence / 100;
      }
      if (mlScore) {
        rawScore *= mlScore;
      }
      impactScore = parseFloat(rawScore.toFixed(4));
    }

    return { outcome, impactScore: parseFloat(impactScore.toFixed(4)) };
  }

  /**
   * Generates learning curve data for a specific mode
   */
  generateLearningCurve(mode: string = 'signal'): LearningCurveData | null {
    const data = this.loadData();
    
    if (!data[mode]) {
      console.log(`No data for mode: ${mode}`);
      return null;
    }

    const symbolData = data[mode];
    const results: Record<string, number> = {
      'TP1': 0,
      'TP2': 0,
      'TP3': 0,
      'SL': 0,
      'Neutral': 0,
    };

    let totalImpactScore = 0;
    let totalSignals = 0;

    for (const symbol in symbolData) {
      for (const record of symbolData[symbol]) {
        results[record.outcome]++;
        totalImpactScore += record.impactScore;
        totalSignals++;
      }
    }

    const winningSignals = results['TP1'] + results['TP2'] + results['TP3'];
    const winRate = totalSignals > 0 ? (winningSignals / totalSignals) * 100 : 0;
    const avgImpactScore = totalSignals > 0 ? totalImpactScore / totalSignals : 0;

    return {
      mode,
      outcomes: results,
      totalSignals,
      winRate: parseFloat(winRate.toFixed(2)),
      avgImpactScore: parseFloat(avgImpactScore.toFixed(4)),
    };
  }

  /**
   * Exports report data for ML training
   */
  exportReport(mode: string = 'signal'): Record<string, SignalRecord[]> | null {
    const data = this.loadData();
    return data[mode] || null;
  }

  /**
   * Gets all learning data
   */
  getAllData(): LearningData {
    return this.loadData();
  }

  /**
   * Clears all learning data
   */
  clearData(): void {
    localStorage.removeItem(SignalLearningTracker.LEARNING_DATA_KEY);
  }

  /**
   * Gets summary statistics for all modes
   */
  getSummaryStats(): Record<string, LearningCurveData> {
    const data = this.loadData();
    const summary: Record<string, LearningCurveData> = {};

    for (const mode in data) {
      const curveData = this.generateLearningCurve(mode);
      if (curveData) {
        summary[mode] = curveData;
      }
    }

    return summary;
  }

  /**
   * Log a signal from TradeSignal interface
   */
  logTradeSignal(
    signal: TradeSignal,
    mode: 'backtest' | 'paper' | 'live' | 'signal',
    marketData?: {
      high?: number;
      low?: number;
      currentPrice?: number;
    }
  ): void {
    this.logSignal({
      symbol: signal.symbol,
      signalType: signal.type.toLowerCase() as 'long' | 'short',
      entry: signal.entryPrice,
      targets: signal.targets,
      hitPrice: marketData?.currentPrice || signal.entryPrice,
      mode,
      timestamp: signal.timestamp,
      high: marketData?.high,
      low: marketData?.low,
      confidence: signal.confidence,
      tradeExecuted: signal.status === 'executed',
    });
  }
}

export default SignalLearningTracker;