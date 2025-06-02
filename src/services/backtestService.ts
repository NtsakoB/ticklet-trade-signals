
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
  // Fetch historical data from Binance
  static async fetchHistoricalData(symbol: string, interval: string, startTime: number, endTime: number): Promise<HistoricalPrice[]> {
    try {
      const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&startTime=${startTime}&endTime=${endTime}&limit=1000`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch historical data');
      }
      
      const data = await response.json();
      
      return data.map((candle: any[]) => ({
        time: candle[0],
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5])
      }));
    } catch (error) {
      console.error('Error fetching historical data:', error);
      return [];
    }
  }

  // Simple momentum strategy for backtesting
  static generateSignals(data: HistoricalPrice[]): Array<{type: 'BUY' | 'SELL', price: number, time: number, confidence: number}> {
    const signals = [];
    const period = 14; // RSI period
    
    for (let i = period; i < data.length; i++) {
      const recentPrices = data.slice(i - period, i);
      const avgPrice = recentPrices.reduce((sum, p) => sum + p.close, 0) / period;
      const currentPrice = data[i].close;
      const priceChange = ((currentPrice - avgPrice) / avgPrice) * 100;
      
      // Generate signals based on price momentum
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

  // Run backtest simulation
  static async runBacktest(symbol: string, startDate: Date, endDate: Date, initialBalance: number = 10000): Promise<BacktestResult> {
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();
    
    // Fetch historical data
    const historicalData = await this.fetchHistoricalData(symbol, '1h', startTime, endTime);
    
    if (historicalData.length === 0) {
      throw new Error('No historical data available');
    }
    
    // Generate trading signals
    const signals = this.generateSignals(historicalData);
    
    // Simulate trades
    let balance = initialBalance;
    let position = 0;
    let positionEntry = 0;
    const trades: StoredTrade[] = [];
    let openTrade: StoredTrade | null = null;
    
    for (const signal of signals) {
      if (signal.type === 'BUY' && position === 0) {
        // Open long position
        const quantity = (balance * 0.1) / signal.price; // Risk 10% of balance
        position = quantity;
        positionEntry = signal.price;
        
        openTrade = {
          id: `backtest-${Date.now()}-${Math.random()}`,
          symbol,
          type: 'BUY',
          entryPrice: signal.price,
          entryTime: new Date(signal.time).toISOString(),
          quantity,
          leverage: 1,
          status: 'open',
          tradeType: 'live',
          strategy: 'momentum'
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
      strategy: 'momentum',
      period: `${startDate.toDateString()} - ${endDate.toDateString()}`,
      initialBalance,
      finalBalance: balance,
      totalReturn,
      trades,
      winRate,
      maxDrawdown,
      sharpeRatio: isNaN(sharpeRatio) ? 0 : sharpeRatio,
      createdAt: new Date().toISOString()
    };
    
    // Save backtest result
    StorageService.saveBacktestResult(result);
    
    return result;
  }

  // Get monthly returns for the specified period
  static async getMonthlyReturns(startYear: number = 2021, endYear: number = 2024): Promise<Array<{month: string, return: number, trades: number}>> {
    const backtestResults = StorageService.getBacktestResults();
    const monthlyData = [];
    
    for (let year = startYear; year <= endYear; year++) {
      for (let month = 0; month < 12; month++) {
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0);
        
        // Find trades in this month from stored backtests
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
