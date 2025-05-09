
import { TradeSignal, DashboardStats } from "@/types";
import { toast } from "sonner";

// Base URL for Binance API
const BINANCE_API_BASE_URL = "https://api.binance.com/api/v3";

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
export async function fetchMultipleSymbols(symbols: string[] = ["BTCUSDT", "ETHUSDT", "XRPUSDT", "SOLUSDT"]) {
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
export function convertToSignals(binanceData: any[]): TradeSignal[] {
  if (!binanceData || !binanceData.length) return [];
  
  return binanceData.map(data => {
    // Determine if price is increasing or decreasing
    const priceChangePercent = parseFloat(data.priceChangePercent);
    const type = priceChangePercent >= 0 ? "BUY" : "SELL";
    const currentPrice = parseFloat(data.lastPrice);
    
    // Calculate targets and stop loss based on current price and volatility
    const volatility = Math.abs(priceChangePercent) / 100;
    const targetMultiplier = type === "BUY" ? 1 + volatility : 1 - volatility;
    const stopLossMultiplier = type === "BUY" ? 1 - (volatility * 0.5) : 1 + (volatility * 0.5);
    
    // Randomly assign signal source for demonstration
    const sources = ["strategy", "telegram", "manual"];
    const source = sources[Math.floor(Math.random() * sources.length)] as "strategy" | "telegram" | "manual";
    
    return {
      id: data.symbol,
      symbol: data.symbol,
      type,
      entryPrice: currentPrice,
      targets: [
        parseFloat((currentPrice * targetMultiplier).toFixed(2)),
        parseFloat((currentPrice * (targetMultiplier + (type === "BUY" ? 0.02 : -0.02))).toFixed(2))
      ],
      stopLoss: parseFloat((currentPrice * stopLossMultiplier).toFixed(2)),
      confidence: Math.min(Math.abs(priceChangePercent) / 10 + 0.5, 0.95),
      anomaly: Math.abs(priceChangePercent) > 5,
      timestamp: new Date().toISOString(),
      status: "active",
      exchange: "Binance",
      source
    };
  });
}

// Calculate dashboard stats from signals
export function calculateDashboardStats(signals: TradeSignal[]): DashboardStats {
  const mockBalance = 25000 + (Math.random() * 5000); // Just for demo purposes
  
  return {
    activeSignals: signals.filter(s => s.status === "active").length,
    executedTrades: signals.length,
    winRate: 0.65, // This would need actual historical data to calculate accurately
    capitalAtRisk: signals.reduce((sum, signal) => {
      // Simple calculation - 1% of entry price per signal
      return sum + (signal.entryPrice * 0.01);
    }, 0),
    totalBalance: mockBalance
  };
}
