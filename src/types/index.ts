
export interface TradeSignal {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  targets: number[];
  stopLoss: number;
  confidence: number;
  anomaly: boolean;
  anomaly_score?: number; // 0-100 numerical anomaly score for ML tracking
  timestamp: string;
  status: 'active' | 'executed' | 'cancelled' | 'completed';
  exchange: 'Bybit' | 'Binance' | 'Other';
  source?: 'strategy' | 'telegram' | 'manual';
  strategy?: string;
  strategyName?: string;
  pnl?: number;
  exitPrice?: number;
  exitTime?: string;
  volume?: number;
  leverage?: number;
  duration?: string;
  exposure?: number;
  exposurePercentage?: number;
  metadata?: {
    strategy?: string;
    strategyVersion?: string;
    generatedBy?: string;
    indicators?: string[];
    [key: string]: any;
  };
}

export interface SignalFilter {
  symbols?: string[];
  types?: ('BUY' | 'SELL')[];
  confidence?: number;
  status?: ('active' | 'executed' | 'cancelled' | 'completed')[];
  exchange?: string[];
  source?: ('strategy' | 'telegram' | 'manual')[];
  minimumVolume?: number;
}

export interface DashboardStats {
  activeSignals: number;
  executedTrades: number;
  winRate: number;
  capitalAtRisk: number;
  totalBalance?: number;
  startingBalance?: number;
  performanceHistory?: PerformancePoint[];
}

export interface PerformancePoint {
  date: string;
  balance: number;
  winRate: number;
  tradesCount: number;
}

export interface Settings {
  telegramEnabled: boolean;
  apiKey: string;
  apiSecret: string;
  maxRiskPerTrade: number;
  maxOpenTrades: number;
}
