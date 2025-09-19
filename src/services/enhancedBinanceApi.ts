
import { TradeSignal } from "@/types";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

// Use backend proxy when available, fallback to direct calls with error handling
const USE_BACKEND_PROXY = true;
const BINANCE_API_BASE_URL = "https://api.binance.com/api/v3";

interface BinanceSymbol {
  symbol: string;
  status: string;
  baseAsset: string;
  quoteAsset: string;
}

// Mock data for when Binance API is unavailable
const MOCK_SYMBOLS: BinanceSymbol[] = [
  { symbol: "BTCUSDT", status: "TRADING", baseAsset: "BTC", quoteAsset: "USDT" },
  { symbol: "ETHUSDT", status: "TRADING", baseAsset: "ETH", quoteAsset: "USDT" },
  { symbol: "SOLUSDT", status: "TRADING", baseAsset: "SOL", quoteAsset: "USDT" },
  { symbol: "BNBUSDT", status: "TRADING", baseAsset: "BNB", quoteAsset: "USDT" },
  { symbol: "ADAUSDT", status: "TRADING", baseAsset: "ADA", quoteAsset: "USDT" },
];

const MOCK_TICKER_DATA = [
  { symbol: "BTCUSDT", lastPrice: "68500.00", volume: "25000", priceChangePercent: "2.45" },
  { symbol: "ETHUSDT", lastPrice: "3850.00", volume: "85000", priceChangePercent: "1.85" },
  { symbol: "SOLUSDT", lastPrice: "185.50", volume: "45000", priceChangePercent: "3.25" },
  { symbol: "BNBUSDT", lastPrice: "642.50", volume: "15000", priceChangePercent: "-0.85" },
  { symbol: "ADAUSDT", lastPrice: "0.9850", volume: "125000", priceChangePercent: "1.65" },
];

class EnhancedBinanceApi {
  private static symbolsCache: BinanceSymbol[] = [];
  private static lastSymbolsFetch = 0;
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Fetch all available trading symbols
  static async fetchAllSymbols(): Promise<BinanceSymbol[]> {
    const now = Date.now();
    
    // Return cached data if still valid
    if (this.symbolsCache.length > 0 && now - this.lastSymbolsFetch < this.CACHE_DURATION) {
      return this.symbolsCache;
    }

    try {
      // Try backend proxy first if available
      if (USE_BACKEND_PROXY) {
        try {
          const symbols = await apiFetch("/api/market/symbols");
          this.symbolsCache = symbols;
          this.lastSymbolsFetch = now;
          return this.symbolsCache;
        } catch (e) {
          console.log("Backend proxy not available, trying direct call");
        }
      }

      // Fallback to direct Binance API call
      const response = await fetch(`${BINANCE_API_BASE_URL}/exchangeInfo`);
      if (!response.ok) {
        throw new Error(`Error fetching symbols: ${response.statusText}`);
      }
      
      const data = await response.json();
      this.symbolsCache = data.symbols.filter((symbol: any) => 
        symbol.status === 'TRADING' && 
        symbol.quoteAsset === 'USDT'
      );
      this.lastSymbolsFetch = now;
      
      return this.symbolsCache;
    } catch (error) {
      console.warn("Failed to fetch symbols, using mock data:", error);
      // Use mock data as fallback
      this.symbolsCache = MOCK_SYMBOLS;
      this.lastSymbolsFetch = now;
      return this.symbolsCache;
    }
  }

  // Fetch market data for multiple symbols with filtering
  static async fetchFilteredMarketData(filters: {
    minimumVolume?: number;
    minimumPriceChange?: number;
    maxResults?: number;
  } = {}): Promise<any[]> {
    try {
      const symbols = await this.fetchAllSymbols();
      const symbolNames = symbols.map(s => s.symbol);
      
      // Try backend proxy first if available
      if (USE_BACKEND_PROXY) {
        try {
          const tickerData = await apiFetch("/api/market/ticker24hr");
          return this.filterAndSortTickers(tickerData, symbolNames, filters);
        } catch (e) {
          console.log("Backend market data proxy not available, trying direct call");
        }
      }

      // Batch fetch ticker data from Binance directly
      const response = await fetch(`${BINANCE_API_BASE_URL}/ticker/24hr`);
      if (!response.ok) {
        throw new Error(`Error fetching market data: ${response.statusText}`);
      }
      
      const allTickers = await response.json();
      return this.filterAndSortTickers(allTickers, symbolNames, filters);
    } catch (error) {
      console.warn("Failed to fetch filtered market data, using mock data:", error);
      // Use mock data as fallback
      return this.filterAndSortTickers(MOCK_TICKER_DATA, MOCK_SYMBOLS.map(s => s.symbol), filters);
    }
  }

  private static filterAndSortTickers(allTickers: any[], symbolNames: string[], filters: any) {
    // Filter USDT pairs only
    const usdtTickers = allTickers.filter((ticker: any) => 
      ticker.symbol.endsWith('USDT') && symbolNames.includes(ticker.symbol)
    );
    
    // Apply filters
    let filteredTickers = usdtTickers;
    
    if (filters.minimumVolume) {
      filteredTickers = filteredTickers.filter((ticker: any) => {
        const volume = parseFloat(ticker.volume) * parseFloat(ticker.lastPrice);
        return volume >= filters.minimumVolume!;
      });
    }
    
    if (filters.minimumPriceChange) {
      filteredTickers = filteredTickers.filter((ticker: any) => 
        Math.abs(parseFloat(ticker.priceChangePercent)) >= filters.minimumPriceChange!
      );
    }
    
    // Sort by volume (highest first)
    filteredTickers.sort((a: any, b: any) => {
      const volumeA = parseFloat(a.volume) * parseFloat(a.lastPrice);
      const volumeB = parseFloat(b.volume) * parseFloat(b.lastPrice);
      return volumeB - volumeA;
    });
    
    // Limit results
    if (filters.maxResults) {
      filteredTickers = filteredTickers.slice(0, filters.maxResults);
    }
    
    return filteredTickers;
  }

  // Convert filtered market data to signals
  static convertToSignals(data: any[], options: {
    minimumConfidence?: number;
    includeAnomaly?: boolean;
  } = {}): TradeSignal[] {
    return data.map((ticker, index) => {
      const symbol = ticker.symbol;
      const price = parseFloat(ticker.lastPrice);
      const volume = parseFloat(ticker.volume) * price;
      const priceChangePercent = parseFloat(ticker.priceChangePercent);
      const volatility = Math.abs(priceChangePercent);

      // Enhanced signal generation logic
      const type: "BUY" | "SELL" = priceChangePercent > 0 ? "BUY" : "SELL";
      const entryPrice = price;
      
      // Calculate confidence based on multiple factors
      let confidence = Math.min(volatility / 10 + 0.3, 0.9);
      
      // Volume factor
      if (volume > 10000000) confidence += 0.1; // $10M+ volume
      if (volume > 50000000) confidence += 0.1; // $50M+ volume
      
      // Volatility factor
      if (volatility > 3) confidence += 0.05;
      if (volatility > 7) confidence += 0.1;
      
      confidence = Math.min(confidence, 0.95);
      
      // Skip signals below minimum confidence
      if (options.minimumConfidence && confidence < options.minimumConfidence) {
        return null;
      }
      
      // Calculate targets and stop loss
      const multiplier = type === "BUY" ? 1 : -1;
      const targets = [
        price * (1 + (multiplier * 0.02)),
        price * (1 + (multiplier * 0.05)),
        price * (1 + (multiplier * 0.08))
      ];
      
      const stopLoss = type === "BUY" ? price * 0.97 : price * 1.03;
      
      // Determine anomaly
      const anomaly = options.includeAnomaly ? volatility > 5 : false;
      
      // Calculate leverage based on confidence
      const leverage = Math.max(1, Math.min(20, Math.floor(confidence * 15)));
      
      return {
        id: `signal-${Date.now()}-${index}`,
        symbol,
        type,
        entryPrice,
        targets: type === "BUY" ? targets : targets.reverse(),
        stopLoss,
        confidence,
        anomaly,
        timestamp: new Date().toISOString(),
        status: "active" as const,
        exchange: "Binance" as const,
        source: "strategy" as const,
        volume,
        leverage,
        exposure: volume * 0.001, // 0.1% of volume as exposure
        exposurePercentage: (volume * 0.001 / 10000) * 100 // Percentage of 10k portfolio
      };
    }).filter(Boolean) as TradeSignal[];
  }
}

export default EnhancedBinanceApi;
