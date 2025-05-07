
export interface TradeSignal {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  targets: number[];
  stopLoss: number;
  confidence: number;
  anomaly: boolean;
  timestamp: string;
  status: 'active' | 'executed' | 'cancelled' | 'completed';
  exchange: 'Bybit' | 'Binance' | 'Other';
}

export interface SignalFilter {
  symbols?: string[];
  types?: ('BUY' | 'SELL')[];
  confidence?: number;
  status?: ('active' | 'executed' | 'cancelled' | 'completed')[];
  exchange?: string[];
}

export interface DashboardStats {
  activeSignals: number;
  executedTrades: number;
  winRate: number;
  capitalAtRisk: number;
}

export interface Settings {
  telegramEnabled: boolean;
  apiKey: string;
  apiSecret: string;
  maxRiskPerTrade: number;
  maxOpenTrades: number;
}
