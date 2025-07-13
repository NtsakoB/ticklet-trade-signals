import { TradeSignal } from "@/types";

export interface MarketSummaryData {
  topMovers: {
    gainers: Array<{
      symbol: string;
      price: number;
      change: number;
      changePercent: number;
    }>;
    losers: Array<{
      symbol: string;
      price: number;
      change: number;
      changePercent: number;
    }>;
  };
  marketSentiment: {
    overall: "Bullish" | "Bearish" | "Neutral";
    confidence: number;
    description: string;
  };
  keyMetrics: {
    btcDominance: number;
    ethDominance: number;
    totalMarketCap: number;
    volume24h: number;
  };
  keyEvents: string[];
}

export interface TradeRecap {
  id: string;
  pair: string;
  direction: "LONG" | "SHORT";
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  pnlPercent: number;
  entryReason: string;
  exitReason: string;
  duration: string;
  timestamp: string;
}

class MarketSummaryService {
  private static BINANCE_API_BASE = "https://api.binance.com/api/v3";

  // Generate market summary from Binance data
  static async generateMarketSummary(): Promise<MarketSummaryData> {
    try {
      // Fetch 24hr ticker data for all symbols
      const response = await fetch(`${this.BINANCE_API_BASE}/ticker/24hr`);
      const tickers = await response.json();

      // Filter USDT pairs and sort by volume
      const usdtPairs = tickers
        .filter((ticker: any) => ticker.symbol.endsWith('USDT'))
        .sort((a: any, b: any) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
        .slice(0, 50); // Top 50 by volume

      // Get top gainers and losers
      const gainers = usdtPairs
        .filter((ticker: any) => parseFloat(ticker.priceChangePercent) > 0)
        .sort((a: any, b: any) => parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent))
        .slice(0, 5)
        .map((ticker: any) => ({
          symbol: ticker.symbol,
          price: parseFloat(ticker.lastPrice),
          change: parseFloat(ticker.priceChange),
          changePercent: parseFloat(ticker.priceChangePercent)
        }));

      const losers = usdtPairs
        .filter((ticker: any) => parseFloat(ticker.priceChangePercent) < 0)
        .sort((a: any, b: any) => parseFloat(a.priceChangePercent) - parseFloat(b.priceChangePercent))
        .slice(0, 5)
        .map((ticker: any) => ({
          symbol: ticker.symbol,
          price: parseFloat(ticker.lastPrice),
          change: parseFloat(ticker.priceChange),
          changePercent: parseFloat(ticker.priceChangePercent)
        }));

      // Calculate market sentiment
      const totalPairs = usdtPairs.length;
      const positivePairs = usdtPairs.filter((ticker: any) => parseFloat(ticker.priceChangePercent) > 0).length;
      const negativePairs = usdtPairs.filter((ticker: any) => parseFloat(ticker.priceChangePercent) < 0).length;
      
      const bullishRatio = positivePairs / totalPairs;
      let sentiment: "Bullish" | "Bearish" | "Neutral";
      let confidence: number;
      let description: string;

      if (bullishRatio > 0.6) {
        sentiment = "Bullish";
        confidence = Math.min((bullishRatio - 0.6) * 2.5, 1);
        description = `${positivePairs} out of ${totalPairs} major pairs are in the green. Strong bullish momentum across the market.`;
      } else if (bullishRatio < 0.4) {
        sentiment = "Bearish";
        confidence = Math.min((0.4 - bullishRatio) * 2.5, 1);
        description = `${negativePairs} out of ${totalPairs} major pairs are declining. Market showing bearish sentiment.`;
      } else {
        sentiment = "Neutral";
        confidence = 0.5;
        description = `Mixed signals with ${positivePairs} gainers and ${negativePairs} losers. Market is in consolidation mode.`;
      }

      // Get BTC and ETH data for dominance calculation
      const btcTicker = usdtPairs.find((t: any) => t.symbol === 'BTCUSDT');
      const ethTicker = usdtPairs.find((t: any) => t.symbol === 'ETHUSDT');

      // Calculate total market cap (simplified estimation)
      const totalVolume = usdtPairs.reduce((sum: number, ticker: any) => 
        sum + parseFloat(ticker.quoteVolume), 0);

      // Mock dominance data (in real app, this would come from CoinGecko or similar)
      const btcDominance = 42.5 + (Math.random() * 5 - 2.5); // ~40-45%
      const ethDominance = 18.5 + (Math.random() * 3 - 1.5); // ~17-20%

      // Generate key events (mock data - in real app would integrate with news APIs)
      const keyEvents = [
        "Federal Reserve maintains interest rates at current level",
        "Major institutional adoption of Bitcoin continues",
        "Ethereum network upgrade completed successfully",
        "Regulatory clarity improving in major markets"
      ];

      return {
        topMovers: {
          gainers,
          losers
        },
        marketSentiment: {
          overall: sentiment,
          confidence,
          description
        },
        keyMetrics: {
          btcDominance,
          ethDominance,
          totalMarketCap: totalVolume * 15, // Rough estimation
          volume24h: totalVolume
        },
        keyEvents
      };
    } catch (error) {
      console.error('Failed to generate market summary:', error);
      throw error;
    }
  }

  // Generate trade recap from stored trade data
  static generateTradeRecap(trade: any): TradeRecap {
    const entryTime = new Date(trade.entryTime);
    const exitTime = new Date(trade.exitTime || trade.entryTime);
    const duration = this.calculateDuration(entryTime, exitTime);

    // Generate reasons based on trade data
    const entryReason = this.generateEntryReason(trade);
    const exitReason = this.generateExitReason(trade);

    return {
      id: trade.id,
      pair: trade.symbol,
      direction: trade.type,
      entryPrice: trade.entryPrice,
      exitPrice: trade.exitPrice || trade.entryPrice,
      pnl: trade.pnl || 0,
      pnlPercent: ((trade.pnl || 0) / (trade.quantity * trade.entryPrice)) * 100,
      entryReason,
      exitReason,
      duration,
      timestamp: trade.exitTime || trade.entryTime
    };
  }

  private static calculateDuration(start: Date, end: Date): string {
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 24) {
      const days = Math.floor(diffHours / 24);
      const hours = diffHours % 24;
      return `${days}d ${hours}h`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  }

  private static generateEntryReason(trade: any): string {
    const strategies = [
      "RSI oversold + MACD bullish crossover",
      "Breakout above key resistance level",
      "Golden cross formation on moving averages",
      "High volume accumulation pattern",
      "Bullish divergence on momentum indicators",
      "Support level bounce with confirmation",
      "Trend continuation signal"
    ];
    
    return trade.strategy || strategies[Math.floor(Math.random() * strategies.length)];
  }

  private static generateExitReason(trade: any): string {
    if (!trade.exitPrice || !trade.pnl) {
      return "Trade still open";
    }

    if (trade.pnl > 0) {
      const profitable = [
        "Reached take-profit target",
        "Strong resistance encountered",
        "Overbought conditions on RSI",
        "Profit-taking at key level",
        "Technical target achieved"
      ];
      return profitable[Math.floor(Math.random() * profitable.length)];
    } else {
      const losing = [
        "Stop-loss triggered",
        "Market conditions changed",
        "Break below support level",
        "Risk management exit",
        "Invalidation of setup"
      ];
      return losing[Math.floor(Math.random() * losing.length)];
    }
  }

  // Format summary for Telegram
  static formatForTelegram(summary: MarketSummaryData): string {
    const { topMovers, marketSentiment, keyMetrics } = summary;

    let message = "📊 **Daily Market Summary**\n\n";
    
    // Market sentiment
    const sentimentEmoji = marketSentiment.overall === "Bullish" ? "🟢" : 
                          marketSentiment.overall === "Bearish" ? "🔴" : "🟡";
    message += `${sentimentEmoji} **Market Sentiment**: ${marketSentiment.overall}\n`;
    message += `📈 **Confidence**: ${(marketSentiment.confidence * 100).toFixed(0)}%\n`;
    message += `💭 ${marketSentiment.description}\n\n`;

    // Top gainers
    message += "🚀 **Top Gainers**:\n";
    topMovers.gainers.forEach((gainer, i) => {
      message += `${i + 1}. ${gainer.symbol}: +${gainer.changePercent.toFixed(2)}%\n`;
    });

    // Top losers
    message += "\n📉 **Top Losers**:\n";
    topMovers.losers.forEach((loser, i) => {
      message += `${i + 1}. ${loser.symbol}: ${loser.changePercent.toFixed(2)}%\n`;
    });

    // Key metrics
    message += `\n📊 **Key Metrics**:\n`;
    message += `₿ BTC Dominance: ${keyMetrics.btcDominance.toFixed(1)}%\n`;
    message += `⚡ ETH Dominance: ${keyMetrics.ethDominance.toFixed(1)}%\n`;
    message += `💰 24h Volume: $${(keyMetrics.volume24h / 1e9).toFixed(1)}B\n`;

    return message;
  }

  // Format trade recap for Telegram
  static formatTradeRecapForTelegram(recap: TradeRecap): string {
    const directionEmoji = recap.direction === "LONG" ? "🟢" : "🔴";
    const pnlEmoji = recap.pnl > 0 ? "💰" : "❌";
    
    let message = `${directionEmoji} **Trade Recap**\n\n`;
    message += `📊 **Pair**: ${recap.pair}\n`;
    message += `📍 **Direction**: ${recap.direction}\n`;
    message += `🎯 **Entry**: $${recap.entryPrice.toFixed(4)}\n`;
    message += `🏁 **Exit**: $${recap.exitPrice.toFixed(4)}\n`;
    message += `${pnlEmoji} **P&L**: ${recap.pnl > 0 ? '+' : ''}$${recap.pnl.toFixed(2)} (${recap.pnlPercent > 0 ? '+' : ''}${recap.pnlPercent.toFixed(2)}%)\n`;
    message += `⏱️ **Duration**: ${recap.duration}\n\n`;
    message += `💡 **Entry Reason**: ${recap.entryReason}\n`;
    message += `🎬 **Exit Reason**: ${recap.exitReason}\n`;

    return message;
  }
}

export default MarketSummaryService;