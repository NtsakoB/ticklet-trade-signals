import { TradeSignal, DashboardStats, PerformancePoint } from "@/types";
import { toast } from "sonner";

// Base URL for Binance API
const BINANCE_API_BASE_URL = "https://api.binance.com/api/v3";

// List of cryptocurrencies to track (expanded list)
const DEFAULT_SYMBOLS = [
  "BTCUSDT", "ETHUSDT", "XRPUSDT", "SOLUSDT", "BNBUSDT", 
  "ADAUSDT", "DOGEUSDT", "DOTUSDT", "MATICUSDT", "LINKUSDT",
  "AVAXUSDT", "UNIUSDT", "ATOMUSDT", "LTCUSDT", "ETCUSDT",
  "ALGOUSDT", "FILUSDT", "XLMUSDT", "VETUSDT", "TRXUSDT"
];

// Fetch market data from Binance
export async function fetchMarketData(symbol: string = "BTCUSDT") {
  try {
    const response = await fetch(`${BINANCE_API_BASE_URL}/ticker/24hr?symbol=${symbol}`);
    if (!response.ok) {
      throw new Error(`Error fetching market data: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch market data:", error);
    toast.error("Failed to fetch market data from Binance");
    return null;
  }
}

// Fetch multiple symbols data
export async function fetchMultipleSymbols(symbols: string[] = DEFAULT_SYMBOLS) {
  try {
    const promises = symbols.map(symbol => fetchMarketData(symbol));
    const results = await Promise.all(promises);
    return results.filter(Boolean); // Filter out any null results
  } catch (error) {
    console.error("Failed to fetch multiple symbols:", error);
    return [];
  }
}

// Convert Binance data to TradeSignal format
export const convertToSignals = (data: any[], minimumVolume: number = 50000): TradeSignal[] => {
  return data
    .filter(ticker => parseFloat(ticker.volume) * parseFloat(ticker.price) >= minimumVolume)
    .slice(0, 20) // Limit to top 20 by volume
    .map((ticker, index) => {
      const symbol = ticker.symbol;
      const price = parseFloat(ticker.price);
      const volume = parseFloat(ticker.volume) * price;
      const priceChangePercent = parseFloat(ticker.priceChangePercent);

      // Generate trading signal based on price movement and volume
      const type: "BUY" | "SELL" = priceChangePercent > 0 ? "BUY" : "SELL";
      const entryPrice = price;
      const confidenceScore = Math.min(Math.abs(priceChangePercent) / 10 + 0.3, 0.9);
      
      // Calculate targets and stop loss
      const targets = type === "BUY" 
        ? [price * 1.02, price * 1.05, price * 1.08]
        : [price * 0.98, price * 0.95, price * 0.92];
      
      const stopLoss = type === "BUY" ? price * 0.97 : price * 1.03;
      
      // Generate timestamp
      const timestamp = new Date().toISOString();
      
      // Determine source based on confidence
      const source: "strategy" | "telegram" | "manual" = confidenceScore > 0.7 ? "strategy" : "telegram";
      
      // Calculate leverage based on confidence
      const leverage = Math.floor(confidenceScore * 10) + 1;
      
      // Calculate exposure (mock calculation)
      const baseExposure = 1000; // Base exposure amount
      const exposure = baseExposure * leverage * confidenceScore;
      const exposurePercentage = (exposure / 10000) * 100; // Assuming 10k portfolio
      
      return {
        id: `signal-${Date.now()}-${index}`,
        symbol,
        type,
        entryPrice,
        targets,
        stopLoss,
        confidence: confidenceScore,
        anomaly: Math.abs(priceChangePercent) > 5,
        timestamp,
        status: "active" as const,
        exchange: "Binance" as const,
        source,
        volume,
        leverage,
        exposure,
        exposurePercentage
      };
    });
};

// Calculate dashboard stats from signals
export function calculateDashboardStats(signals: TradeSignal[]): DashboardStats {
  const mockBalance = 25000 + (Math.random() * 5000); // Just for demo purposes
  const mockStartingBalance = 20000; // Starting balance for demonstration
  
  // Generate performance history (last 30 days)
  const performanceHistory: PerformancePoint[] = Array.from({ length: 30 }, (_, i) => {
    const daysAgo = 29 - i;
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    
    // Simulate progressive growth
    const growthFactor = 1 + ((30 - daysAgo) * 0.005); // Approx 15% growth over 30 days
    const randomVariation = 0.98 + (Math.random() * 0.04); // ±2% random variation
    
    return {
      date: date.toISOString().split('T')[0],
      balance: mockStartingBalance * growthFactor * randomVariation,
      winRate: 0.5 + (Math.random() * 0.3), // Win rate between 50-80%
      tradesCount: Math.floor(5 + (Math.random() * 10)) // 5-15 trades per day
    };
  });
  
  return {
    activeSignals: signals.filter(s => s.status === "active").length,
    executedTrades: signals.length,
    winRate: 0.65, // This would need actual historical data to calculate accurately
    capitalAtRisk: signals.reduce((sum, signal) => {
      // Calculate risk based on position size and leverage
      return sum + (signal.exposure || 0);
    }, 0),
    totalBalance: mockBalance,
    startingBalance: mockStartingBalance,
    performanceHistory
  };
}

// Generate future projections based on current performance
export function generateProjections(days: number = 30, currentStats: DashboardStats): PerformancePoint[] {
  if (!currentStats.performanceHistory || currentStats.performanceHistory.length === 0) {
    return [];
  }
  
  // Calculate average daily growth rate from performance history
  const history = currentStats.performanceHistory;
  const firstBalance = history[0].balance;
  const lastBalance = history[history.length - 1].balance;
  const dailyGrowthRate = Math.pow(lastBalance / firstBalance, 1 / history.length) - 1;
  
  // Current values (from the last day in history)
  const lastDay = history[history.length - 1];
  let currentBalance = lastDay.balance;
  let currentWinRate = lastDay.winRate;
  const today = new Date();
  
  return Array.from({ length: days }, (_, i) => {
    const projectedDate = new Date();
    projectedDate.setDate(today.getDate() + i + 1);
    
    // Apply daily growth with some randomness
    const randomVariation = 0.99 + (Math.random() * 0.02); // ±1% random variation
    currentBalance = currentBalance * (1 + (dailyGrowthRate * randomVariation));
    
    // Win rate tends to stabilize around 65-70% over time
    currentWinRate = currentWinRate * 0.95 + (0.675 * 0.05); // Slow convergence to 67.5%
    
    // Add small random fluctuations
    currentWinRate += (Math.random() * 0.06) - 0.03; // ±3% random variation
    currentWinRate = Math.min(Math.max(currentWinRate, 0.5), 0.85); // Keep between 50-85%
    
    return {
      date: projectedDate.toISOString().split('T')[0],
      balance: currentBalance,
      winRate: currentWinRate,
      tradesCount: Math.floor(5 + (Math.random() * 10)) // 5-15 trades per day
    };
  });
}
