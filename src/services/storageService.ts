
interface StoredTrade {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice?: number;
  entryTime: string;
  exitTime?: string;
  quantity: number;
  leverage: number;
  pnl?: number;
  status: 'open' | 'closed';
  tradeType: 'live' | 'paper';
  strategy: string;
}

interface BacktestResult {
  id: string;
  strategy: string;
  period: string;
  initialBalance: number;
  finalBalance: number;
  totalReturn: number;
  trades: StoredTrade[];
  winRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
  createdAt: string;
}

class StorageService {
  private static TRADES_KEY = 'trading_bot_trades';
  private static BACKTEST_KEY = 'trading_bot_backtests';
  private static SETTINGS_KEY = 'trading_bot_settings';

  // Trades management
  static saveTrade(trade: StoredTrade): void {
    const trades = this.getTrades();
    trades.push(trade);
    localStorage.setItem(this.TRADES_KEY, JSON.stringify(trades));
  }

  static getTrades(): StoredTrade[] {
    const stored = localStorage.getItem(this.TRADES_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  static updateTrade(tradeId: string, updates: Partial<StoredTrade>): void {
    const trades = this.getTrades();
    const index = trades.findIndex(t => t.id === tradeId);
    if (index !== -1) {
      trades[index] = { ...trades[index], ...updates };
      localStorage.setItem(this.TRADES_KEY, JSON.stringify(trades));
    }
  }

  static deleteTrade(tradeId: string): void {
    const trades = this.getTrades();
    const filtered = trades.filter(t => t.id !== tradeId);
    localStorage.setItem(this.TRADES_KEY, JSON.stringify(filtered));
  }

  // Backtest results management
  static saveBacktestResult(result: BacktestResult): void {
    const results = this.getBacktestResults();
    results.push(result);
    localStorage.setItem(this.BACKTEST_KEY, JSON.stringify(results));
  }

  static getBacktestResults(): BacktestResult[] {
    const stored = localStorage.getItem(this.BACKTEST_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  // Settings management
  static saveSettings(settings: any): void {
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
  }

  static getSettings(): any {
    const stored = localStorage.getItem(this.SETTINGS_KEY);
    return stored ? JSON.parse(stored) : {
      leverage: 10,
      dynamicLeverage: false,
      riskPerTrade: 2,
      maxOpenTrades: 5
    };
  }

  // Calculate actual win rate from stored trades
  static calculateActualWinRate(): number {
    const trades = this.getTrades().filter(t => t.status === 'closed');
    if (trades.length === 0) return 0;
    
    const winningTrades = trades.filter(t => (t.pnl || 0) > 0);
    return (winningTrades.length / trades.length) * 100;
  }

  // Calculate total PnL
  static calculateTotalPnL(): number {
    const trades = this.getTrades().filter(t => t.status === 'closed');
    return trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  }
}

export default StorageService;
export type { StoredTrade, BacktestResult };
