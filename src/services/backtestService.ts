import { fetchMarketData } from './binanceApi';
import StorageService, { BacktestResult, StoredTrade } from './storageService';

interface HistoricalPrice {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

class BacktestService {
  // Fetch historical data from Binance with multiple batches for 5-year data
  static async fetchHistoricalData(symbol: string, interval: string, startTime: number, endTime: number): Promise<HistoricalPrice[]> {
    try {
      const allData: HistoricalPrice[] = [];
      const batchSize = 1000; // Binance limit
      const intervalMs = this.getIntervalMs(interval);
      
      let currentStart = startTime;
      
      while (currentStart < endTime) {
        const batchEnd = Math.min(currentStart + (batchSize * intervalMs), endTime);
        
        const response = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&startTime=${currentStart}&endTime=${batchEnd}&limit=${batchSize}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch historical data');
        }
        
        const data = await response.json();
        
        if (data.length === 0) break;
        
        const batchData = data.map((candle: any[]) => ({
          time: candle[0],
          open: parseFloat(candle[1]),
          high: parseFloat(candle[2]),
          low: parseFloat(candle[3]),
          close: parseFloat(candle[4]),
          volume: parseFloat(candle[5])
        }));
        
        allData.push(...batchData);
        currentStart = batchData[batchData.length - 1].time + intervalMs;
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      return allData;
    } catch (error) {
      console.error('Error fetching historical data:', error);
      return [];
    }
  }

  private static getIntervalMs(interval: string): number {
    const map: { [key: string]: number } = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000
    };
    return map[interval] || 60 * 60 * 1000;
  }

  // Dynamic strategy-aware signal generation
  static async generateSignals(data: HistoricalPrice[], strategyType: string): Promise<Array<{type: 'BUY' | 'SELL', price: number, time: number, confidence: number}>> {
    // For now, use momentum signals for all strategies until strategy methods are implemented
    // TODO: Implement actual strategy signal generation
    return this.generateMomentumSignals(data);
  }

  private static generateMomentumSignals(data: HistoricalPrice[]): Array<{type: 'BUY' | 'SELL', price: number, time: number, confidence: number}> {
    const signals = [];
    const period = 14;
    
    for (let i = period; i < data.length; i++) {
      const recentPrices = data.slice(i - period, i);
      const avgPrice = recentPrices.reduce((sum, p) => sum + p.close, 0) / period;
      const currentPrice = data[i].close;
      const priceChange = ((currentPrice - avgPrice) / avgPrice) * 100;
      
      if (Math.abs(priceChange) > 2) {
        signals.push({
          type: priceChange > 0 ? 'BUY' : 'SELL',
          price: currentPrice,
          time: data[i].time,
          confidence: Math.min(Math.abs(priceChange) / 10, 0.9)
        });
      }
    }
    
    return signals;
  }

  private static getStrategyRiskPct(strategyType: string, confidence: number): number {
    switch (strategyType) {
      case 'ticklet-alpha':
        return confidence > 0.8 ? 0.15 : confidence > 0.6 ? 0.10 : 0.05;
      case 'bull-strategy':
        return confidence > 0.9 ? 0.10 : confidence > 0.8 ? 0.07 : 0.05;
      case 'jam-bot':
        return confidence > 0.7 ? 0.12 : 0.08;
      default:
        return 0.10;
    }
  }

  private static getStrategyLeverage(strategyType: string, confidence: number): number {
    switch (strategyType) {
      case 'ticklet-alpha':
        return confidence > 0.8 ? 10 : confidence > 0.6 ? 7 : 5;
      case 'bull-strategy':
        return confidence > 0.9 ? 10 : confidence > 0.8 ? 7 : 5;
      case 'jam-bot':
        return confidence > 0.7 ? 8 : 5;
      default:
        return 5;
    }
  }

  // Run backtest simulation with strategy-specific logic
  static async runBacktest(
    symbol: string, 
    startDate: Date, 
    endDate: Date, 
    initialBalance: number = 10000,
    strategyType: string = 'ticklet-alpha',
    timeframe: string = '1h'
  ): Promise<BacktestResult> {
    // Use Jan 2020 to current date for full 5-year backtest
    const fullStartDate = new Date('2020-01-01');
    const fullEndDate = new Date(); // Current date
    
    const startTime = fullStartDate.getTime();
    const endTime = fullEndDate.getTime();
    
    console.log(`Running backtest for ${strategyType} from ${fullStartDate.toDateString()} to ${fullEndDate.toDateString()}`);
    
    // Fetch fresh historical data (no caching)
    const historicalData = await this.fetchHistoricalData(symbol, timeframe, startTime, endTime);
    
    if (historicalData.length === 0) {
      throw new Error('No historical data available');
    }
    
    console.log(`Loaded ${historicalData.length} candles for backtest`);
    
    // Generate strategy-specific signals
    const signals = await this.generateSignals(historicalData, strategyType);
    
    console.log(`Generated ${signals.length} signals using ${strategyType} strategy`);
    
    // Simulate trades with strategy-specific parameters
    let balance = initialBalance;
    let position = 0;
    let positionEntry = 0;
    const trades: StoredTrade[] = [];
    let openTrade: StoredTrade | null = null;
    
    for (const signal of signals) {
      if (signal.type === 'BUY' && position === 0) {
        // Risk percentage based on strategy
        const riskPct = this.getStrategyRiskPct(strategyType, signal.confidence);
        const quantity = (balance * riskPct) / signal.price;
        const leverage = this.getStrategyLeverage(strategyType, signal.confidence);
        
        position = quantity;
        positionEntry = signal.price;
        
        openTrade = {
          id: `backtest-${Date.now()}-${Math.random()}`,
          symbol,
          type: 'BUY',
          entryPrice: signal.price,
          entryTime: new Date(signal.time).toISOString(),
          quantity,
          leverage,
          status: 'open',
          tradeType: 'live',
          strategy: strategyType,
          confidence: signal.confidence
        };
        
      } else if (signal.type === 'SELL' && position > 0) {
        // Close long position
        const exitValue = position * signal.price;
        const entryValue = position * positionEntry;
        const pnl = exitValue - entryValue;
        
        balance += pnl;
        
        if (openTrade) {
          const completedTrade: StoredTrade = {
            ...openTrade,
            exitPrice: signal.price,
            exitTime: new Date(signal.time).toISOString(),
            pnl,
            status: 'closed'
          };
          trades.push(completedTrade);
        }
        
        position = 0;
        openTrade = null;
      }
    }
    
    // Calculate statistics
    const winningTrades = trades.filter(t => (t.pnl || 0) > 0);
    const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;
    const totalReturn = ((balance - initialBalance) / initialBalance) * 100;
    
    // Calculate max drawdown
    let peak = initialBalance;
    let maxDrawdown = 0;
    let runningBalance = initialBalance;
    
    for (const trade of trades) {
      runningBalance += (trade.pnl || 0);
      if (runningBalance > peak) {
        peak = runningBalance;
      }
      const drawdown = ((peak - runningBalance) / peak) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    
    // Calculate Sharpe ratio (simplified)
    const returns = trades.map(t => ((t.pnl || 0) / initialBalance) * 100);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length || 0;
    const returnStd = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length) || 1;
    const sharpeRatio = avgReturn / returnStd;
    
    const result: BacktestResult = {
      id: `backtest-${Date.now()}`,
      strategy: strategyType,
      period: `${fullStartDate.toDateString()} - ${fullEndDate.toDateString()}`,
      initialBalance,
      finalBalance: balance,
      totalReturn,
      trades,
      winRate,
      maxDrawdown,
      sharpeRatio: isNaN(sharpeRatio) ? 0 : sharpeRatio,
      createdAt: new Date().toISOString(),
      timeframe,
      totalSignals: signals.length
    };
    
    // Save backtest result
    StorageService.saveBacktestResult(result);
    
    console.log(`Backtest completed: ${trades.length} trades, ${winRate.toFixed(1)}% win rate, ${totalReturn.toFixed(2)}% return`);
    
    return result;
  }

  // Get monthly returns for the specified period, filtered by strategy
  static async getMonthlyReturns(startYear: number = 2021, endYear: number = 2024, strategyFilter?: string): Promise<Array<{month: string, return: number, trades: number}>> {
    const backtestResults = StorageService.getBacktestResults()
      .filter(result => strategyFilter ? result.strategy === strategyFilter : true);
    
    const monthlyData = [];
    
    for (let year = startYear; year <= endYear; year++) {
      for (let month = 0; month < 12; month++) {
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0);
        
        // Find trades in this month from filtered backtests
        const monthTrades = backtestResults.flatMap(result => 
          result.trades.filter(trade => {
            const tradeDate = new Date(trade.entryTime);
            return tradeDate >= monthStart && tradeDate <= monthEnd;
          })
        );
        
        const monthlyReturn = monthTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
        const returnPercentage = (monthlyReturn / 10000) * 100; // Assuming 10k initial balance
        
        monthlyData.push({
          month: `${monthStart.toLocaleDateString('en-US', { month: 'short' })} ${year}`,
          return: returnPercentage,
          trades: monthTrades.length
        });
      }
    }
    
    return monthlyData.filter(data => data.trades > 0); // Only return months with trades
  }
}

export default BacktestService;