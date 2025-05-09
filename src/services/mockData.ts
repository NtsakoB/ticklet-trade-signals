
import { TradeSignal, DashboardStats, Settings } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Generate random trade signals
export const generateMockSignals = (count: number): TradeSignal[] => {
  const symbols = ['BTCUSDT', 'ETHUSDT', 'XRPUSDT', 'DOGEUSDT', 'ADAUSDT', 'SOLUSDT', 'AVAXUSDT'];
  const types: ('BUY' | 'SELL')[] = ['BUY', 'SELL'];
  const statuses: ('active' | 'executed' | 'cancelled' | 'completed')[] = ['active', 'executed', 'cancelled', 'completed'];
  const exchanges: ('Bybit' | 'Binance' | 'Other')[] = ['Bybit', 'Binance', 'Other'];
  const sources: ('strategy' | 'telegram' | 'manual')[] = ['strategy', 'telegram', 'manual'];

  return Array.from({ length: count }, (_, i) => {
    const type = types[Math.floor(Math.random() * types.length)];
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const entryPrice = parseFloat((Math.random() * 1000 + 10).toFixed(2));
    const targets = [
      parseFloat((entryPrice * (type === 'BUY' ? 1.02 : 0.98)).toFixed(2)),
      parseFloat((entryPrice * (type === 'BUY' ? 1.05 : 0.95)).toFixed(2)),
    ];
    const stopLoss = parseFloat((entryPrice * (type === 'BUY' ? 0.97 : 1.03)).toFixed(2));
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    const timestamp = new Date(Date.now() - Math.floor(Math.random() * 86400000)).toISOString();
    
    // For completed trades, add exit details
    let exitPrice, exitTime, pnl;
    if (status === 'completed' || status === 'cancelled') {
      const priceChangePercent = (Math.random() * 10) * (Math.random() > 0.5 ? 1 : -1);
      exitPrice = parseFloat((entryPrice * (1 + (priceChangePercent / 100))).toFixed(2));
      exitTime = new Date(new Date(timestamp).getTime() + Math.floor(Math.random() * 36000000)).toISOString();
      pnl = type === 'BUY' 
        ? (exitPrice - entryPrice) 
        : (entryPrice - exitPrice);
    }
    
    return {
      id: uuidv4(),
      symbol,
      type,
      entryPrice,
      targets,
      stopLoss,
      confidence: parseFloat((Math.random() * 0.5 + 0.5).toFixed(2)), // 0.5 - 1.0
      anomaly: Math.random() > 0.8, // 20% chance of anomaly
      timestamp,
      status,
      exchange: exchanges[Math.floor(Math.random() * exchanges.length)],
      source: sources[Math.floor(Math.random() * sources.length)],
      exitPrice,
      exitTime,
      pnl
    };
  });
};

// Generate mock dashboard stats
export const generateMockStats = (): DashboardStats => {
  return {
    activeSignals: Math.floor(Math.random() * 10 + 1),
    executedTrades: Math.floor(Math.random() * 50 + 10),
    winRate: parseFloat((Math.random() * 0.4 + 0.5).toFixed(2)), // 50% - 90%
    capitalAtRisk: parseFloat((Math.random() * 5000 + 1000).toFixed(2)),
    totalBalance: parseFloat((Math.random() * 50000 + 10000).toFixed(2))
  };
};

// Default settings
export const defaultSettings: Settings = {
  telegramEnabled: true,
  apiKey: '',
  apiSecret: '',
  maxRiskPerTrade: 0.05,
  maxOpenTrades: 11
};

// Mock trade signals
export const mockSignals: TradeSignal[] = generateMockSignals(25);

// Recent signals (last 24 hours)
export const recentSignals: TradeSignal[] = mockSignals
  .filter(signal => new Date(signal.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000))
  .slice(0, 5);

// Completed trades for trade log
export const completedTrades = mockSignals.filter(
  signal => signal.status === 'completed' || signal.status === 'cancelled'
);

