
import StorageService, { StoredTrade } from './storageService';
import { fetchMarketData } from './binanceApi';

class PaperTradingService {
  private static PAPER_BALANCE_KEY = 'paper_trading_balance';
  
  static getPaperBalance(): number {
    const stored = localStorage.getItem(this.PAPER_BALANCE_KEY);
    return stored ? parseFloat(stored) : 10000; // Default $10,000
  }
  
  static setPaperBalance(balance: number): void {
    localStorage.setItem(this.PAPER_BALANCE_KEY, balance.toString());
  }
  
  // Execute a paper trade with zero-value validation
  static async executePaperTrade(signal: any): Promise<StoredTrade> {
    // Validate signal data to prevent zero values
    if (!signal.entryPrice || signal.entryPrice <= 0) {
      console.error(`[PaperTrading] Rejecting trade with zero entry price for ${signal.symbol}: ${signal.entryPrice}`);
      throw new Error(`Invalid signal: Zero entry price for ${signal.symbol}`);
    }
    
    if (!signal.stopLoss || signal.stopLoss <= 0) {
      console.error(`[PaperTrading] Rejecting trade with zero stop loss for ${signal.symbol}: ${signal.stopLoss}`);
      throw new Error(`Invalid signal: Zero stop loss for ${signal.symbol}`);
    }
    
    const currentBalance = this.getPaperBalance();
    const settings = StorageService.getSettings();
    
    // Calculate position size based on risk management
    const riskAmount = (currentBalance * settings.riskPerTrade) / 100;
    const leverage = settings.dynamicLeverage ? this.calculateDynamicLeverage(signal) : settings.leverage;
    const quantity = (riskAmount * leverage) / signal.entryPrice;
    
    // Validate calculated quantity
    if (!quantity || quantity <= 0 || isNaN(quantity)) {
      console.error(`[PaperTrading] Invalid quantity calculation for ${signal.symbol}: ${quantity}`);
      throw new Error(`Invalid position size calculation for ${signal.symbol}`);
    }
    
    console.log(`[PaperTrading] Executing paper trade for ${signal.symbol}: Entry=${signal.entryPrice}, Quantity=${quantity}, Leverage=${leverage}x`);
    
    const trade: StoredTrade = {
      id: `paper-${Date.now()}-${Math.random()}`,
      symbol: signal.symbol,
      type: signal.type,
      entryPrice: signal.entryPrice,
      entryTime: new Date().toISOString(),
      quantity,
      leverage,
      status: 'open',
      tradeType: 'paper',
      strategy: signal.source || 'manual'
    };
    
    StorageService.saveTrade(trade);
    return trade;
  }
  
  // Close a paper trade with validation
  static async closePaperTrade(tradeId: string): Promise<void> {
    const trades = StorageService.getTrades();
    const trade = trades.find(t => t.id === tradeId);
    
    if (!trade || trade.status !== 'open') {
      throw new Error('Trade not found or already closed');
    }
    
    // Get current market price
    const marketData = await fetchMarketData(trade.symbol);
    if (!marketData) {
      throw new Error('Failed to get current market price');
    }
    
    const currentPrice = parseFloat(marketData.lastPrice);
    
    // Validate current price
    if (!currentPrice || currentPrice <= 0 || isNaN(currentPrice)) {
      console.error(`[PaperTrading] Invalid current price for ${trade.symbol}: ${currentPrice}`);
      throw new Error(`Invalid current price for ${trade.symbol}`);
    }
    
    const entryValue = trade.quantity * trade.entryPrice;
    const exitValue = trade.quantity * currentPrice;
    
    let pnl = 0;
    if (trade.type === 'BUY') {
      pnl = (exitValue - entryValue) * trade.leverage;
    } else {
      pnl = (entryValue - exitValue) * trade.leverage;
    }
    
    // Validate PnL calculation
    if (isNaN(pnl)) {
      console.error(`[PaperTrading] Invalid PnL calculation for ${trade.symbol}: ${pnl}`);
      pnl = 0; // Set to zero if calculation fails
    }
    
    console.log(`[PaperTrading] Closing paper trade for ${trade.symbol}: Entry=${trade.entryPrice}, Exit=${currentPrice}, PnL=${pnl.toFixed(2)}`);
    
    // Update paper balance
    const currentBalance = this.getPaperBalance();
    this.setPaperBalance(currentBalance + pnl);
    
    // Update trade
    StorageService.updateTrade(tradeId, {
      exitPrice: currentPrice,
      exitTime: new Date().toISOString(),
      pnl,
      status: 'closed'
    });
  }
  
  // Calculate dynamic leverage based on signal confidence and market conditions
  private static calculateDynamicLeverage(signal: any): number {
    const baseMultiplier = signal.confidence || 0.5;
    const volatilityFactor = Math.min(signal.marketData?.volatility || 2, 10) / 10;
    
    // Higher confidence and lower volatility = higher leverage
    const dynamicLeverage = Math.floor((baseMultiplier * (1 - volatilityFactor)) * 20);
    
    return Math.max(1, Math.min(dynamicLeverage, 20)); // Between 1x and 20x
  }
  
  // Get paper trading statistics
  static getPaperTradingStats() {
    const paperTrades = StorageService.getTrades().filter(t => t.tradeType === 'paper');
    const closedTrades = paperTrades.filter(t => t.status === 'closed');
    const openTrades = paperTrades.filter(t => t.status === 'open');
    
    const totalPnL = closedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0);
    const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
    
    return {
      balance: this.getPaperBalance(),
      totalTrades: paperTrades.length,
      openTrades: openTrades.length,
      closedTrades: closedTrades.length,
      totalPnL,
      winRate,
      paperTrades
    };
  }
}

export default PaperTradingService;
