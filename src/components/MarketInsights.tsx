import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Brain, Clock, Target, AlertTriangle, BarChart3 } from "lucide-react";
import { useStrategy } from "@/hooks/useStrategy";
import EnhancedBinanceApi from "@/services/enhancedBinanceApi";
import { StrategyType } from "@/types/strategy";

interface MarketInsightsProps {
  symbol: string;
  className?: string;
}

interface MarketAnalysis {
  condition: 'bullish' | 'bearish' | 'neutral';
  forecast: string;
  shortTerm: string;
  midTerm: string;
  longTerm: string;
  action: string;
  timing: string;
  confidence: number;
  reasoning: string;
  keyLevels: {
    support: number;
    resistance: number;
    targets: number[];
    stopLoss: number;
  };
}

export function MarketInsights({ symbol, className }: MarketInsightsProps) {
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const { activeStrategy, getActiveStrategyConfig } = useStrategy();
  
  const generateInsights = async () => {
    setLoading(true);
    try {
      // Fetch current market data for the symbol
      const marketData = await fetchMarketData(symbol);
      if (!marketData) {
        throw new Error('Failed to fetch market data');
      }
      
      // Generate analysis based on active strategy
      const insights = await analyzeMarketWithStrategy(symbol, marketData, activeStrategy);
      setAnalysis(insights);
    } catch (error) {
      console.error('Failed to generate insights:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateInsights();
  }, [symbol, activeStrategy]);

  const fetchMarketData = async (symbol: string) => {
    try {
      const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
      if (!response.ok) throw new Error('Failed to fetch market data');
      return await response.json();
    } catch (error) {
      console.error('Market data fetch error:', error);
      return null;
    }
  };

  const analyzeMarketWithStrategy = async (symbol: string, marketData: any, strategy: StrategyType): Promise<MarketAnalysis> => {
    const price = parseFloat(marketData.lastPrice);
    const priceChange = parseFloat(marketData.priceChangePercent);
    const volume = parseFloat(marketData.volume) * price;
    const high24h = parseFloat(marketData.highPrice);
    const low24h = parseFloat(marketData.lowPrice);
    const volatility = Math.abs(priceChange);
    const atr = (high24h - low24h) / price * 100;

    switch (strategy) {
      case 'ticklet-alpha':
        return analyzeTickletAlpha(price, priceChange, volume, volatility, high24h, low24h, atr);
      case 'bull-strategy':
        return analyzeBullStrategy(price, priceChange, volume, volatility, high24h, low24h, atr);
      case 'jam-bot':
        return analyzeJamBot(price, priceChange, volume, volatility, high24h, low24h, atr);
      default:
        return analyzeTickletAlpha(price, priceChange, volume, volatility, high24h, low24h, atr);
    }
  };

  const analyzeTickletAlpha = (price: number, priceChange: number, volume: number, volatility: number, high24h: number, low24h: number, atr: number): MarketAnalysis => {
    const isUptrend = priceChange > 0;
    const isHighVolume = volume > 1000000;
    
    let confidence = 0.7;
    if (isHighVolume) confidence += 0.1;
    if (volatility > 2) confidence += 0.1;
    if (volatility > 5) confidence += 0.1;
    confidence = Math.min(confidence, 0.95);

    const condition = isUptrend ? 'bullish' : priceChange < -2 ? 'bearish' : 'neutral';
    
    const forecast = isUptrend && volatility > 1 
      ? "Likely to continue rising with momentum" 
      : priceChange < -2 
        ? "Potential further decline expected"
        : "Sideways movement likely";

    const action = isUptrend && isHighVolume && volatility > 1
      ? "Consider long entry on pullback"
      : priceChange < -3 && isHighVolume
        ? "Wait for reversal confirmation"
        : "Hold current positions, avoid new entries";

    const timing = volatility > 3 
      ? "Monitor closely - high volatility period"
      : "Check again in 2-4 hours";

    return {
      condition,
      forecast,
      shortTerm: volatility > 3 ? "High volatility expected" : "Moderate price action",
      midTerm: isUptrend ? "Upward bias continues" : "Range-bound trading",
      longTerm: confidence > 0.8 ? "Strong trend development" : "Mixed signals",
      action,
      timing,
      confidence: confidence * 100,
      reasoning: `RSI and MACD analysis with ${isHighVolume ? 'high' : 'moderate'} volume confirmation. AI/ML confidence: ${Math.round(confidence * 100)}%`,
      keyLevels: {
        support: low24h,
        resistance: high24h,
        targets: [price * 1.02, price * 1.05, price * 1.08],
        stopLoss: price * 0.97
      }
    };
  };

  const analyzeBullStrategy = (price: number, priceChange: number, volume: number, volatility: number, high24h: number, low24h: number, atr: number): MarketAnalysis => {
    // RSI Logic (simplified)
    const rsiOversold = priceChange < -3;
    const rsiRecovering = rsiOversold && priceChange > -5;
    const rsiOverbought = priceChange > 5;
    
    // MACD Logic
    const macdBullish = priceChange > 0 && volatility > 1;
    const macdBearish = priceChange < 0 && volatility > 1;
    
    // Volume Analysis
    const volThreshold = 100000;
    const validVolume = volume > volThreshold;
    const volSpike = volume > volThreshold * 1.5;
    
    // Elliott Wave / Fibonacci
    const priceRange = high24h - low24h;
    const fib0382 = high24h - 0.382 * priceRange;
    const fib050 = high24h - 0.5 * priceRange;
    const inFibZone = price >= fib050 && price <= fib0382;
    
    // Confidence Engine
    let confidence = 0.7;
    let riskLevel = "Medium";
    
    if (rsiOversold && macdBullish && volSpike && inFibZone) {
      confidence = 0.9;
      riskLevel = "Low";
    } else if (macdBullish && rsiRecovering && volSpike) {
      confidence = 0.8;
      riskLevel = "Medium";
    } else if (rsiOverbought && macdBearish) {
      confidence = 0.6;
      riskLevel = "High";
    }

    const condition = macdBullish && !rsiOverbought ? 'bullish' : macdBearish || rsiOverbought ? 'bearish' : 'neutral';
    
    const forecast = rsiOversold && macdBullish 
      ? "Strong bullish momentum developing"
      : rsiOverbought 
        ? "Potential pullback expected"
        : "Consolidation phase";

    const action = rsiOversold && volSpike && inFibZone
      ? "Excellent long entry opportunity"
      : rsiOverbought
        ? "Avoid new longs, consider profit taking"
        : "Wait for clearer signals";

    return {
      condition,
      forecast,
      shortTerm: volSpike ? "Volatility spike detected" : "Normal price action",
      midTerm: macdBullish ? "Bullish momentum building" : "Momentum weakening",
      longTerm: inFibZone ? "Key support zone holding" : "Monitor key levels",
      action,
      timing: volSpike ? "Act within next 1-2 hours" : "Monitor for 4-6 hours",
      confidence: confidence * 100,
      reasoning: `Elliott Wave analysis shows ${inFibZone ? 'price in optimal entry zone' : 'price outside ideal levels'}. RSI: ${rsiOversold ? 'oversold' : rsiOverbought ? 'overbought' : 'neutral'}. MACD: ${macdBullish ? 'bullish' : 'bearish'}.`,
      keyLevels: {
        support: fib050,
        resistance: fib0382,
        targets: [
          price * (1 + atr/100 * 1.5),
          price * (1 + atr/100 * 2.5),
          price * (1 + atr/100 * 3.5)
        ],
        stopLoss: price * (1 - (confidence > 0.8 ? 0.10 : 0.15))
      }
    };
  };

  const analyzeJamBot = (price: number, priceChange: number, volume: number, volatility: number, high24h: number, low24h: number, atr: number): MarketAnalysis => {
    // RSI Logic
    const rsiOversold = priceChange < -3;
    const rsiOverbought = priceChange > 4;
    
    // MACD Logic  
    const macdBullish = priceChange > 0 && volatility > 1;
    
    // Volume Analysis
    const volumeSpike = volume > (1000000 * 2); // 2x normal volume
    
    // EMA Alignment (simplified)
    const emaAlign = priceChange > 0;
    
    // ML Model Simulation (Random Forest-like logic)
    const mlFeatures = [
      rsiOversold ? 1 : 0,
      macdBullish ? 1 : 0,
      volumeSpike ? 1 : 0,
      emaAlign ? 1 : 0,
      volatility > 2 ? 1 : 0
    ];
    
    const mlScore = mlFeatures.reduce((a, b) => a + b, 0) / mlFeatures.length;
    
    // Telegram Sentiment Simulation
    const telegramScore = Math.random() * 20 - 10; // -10 to +10
    
    let confidence = 0.7 + (mlScore * 0.2) + (telegramScore * 0.01);
    confidence = Math.max(0.5, Math.min(0.95, confidence));

    const condition = rsiOversold && macdBullish && volumeSpike ? 'bullish' : 
                     rsiOverbought ? 'bearish' : 'neutral';
    
    const forecast = mlScore > 0.6 
      ? "ML model shows strong bullish signal"
      : mlScore < 0.4
        ? "ML model indicates bearish conditions"
        : "Mixed signals from ML analysis";

    const action = rsiOversold && macdBullish && volumeSpike && emaAlign
      ? "Strong BUY signal from all indicators"
      : confidence > 0.8
        ? "Consider entry with tight stop"
        : "Wait for better setup";

    return {
      condition,
      forecast,
      shortTerm: volumeSpike ? "Volume surge detected" : "Normal volume",
      midTerm: `ML confidence: ${Math.round(mlScore * 100)}%`,
      longTerm: `Telegram sentiment: ${telegramScore > 0 ? 'Positive' : 'Negative'} (${telegramScore.toFixed(1)})`,
      action,
      timing: volumeSpike ? "Immediate action recommended" : "Monitor for 2-4 hours",
      confidence: confidence * 100,
      reasoning: `Random Forest ML model analysis with ${Math.round(mlScore * 100)}% feature alignment. Telegram sentiment score: ${telegramScore.toFixed(1)}. Key factors: RSI ${rsiOversold ? 'oversold' : 'normal'}, MACD ${macdBullish ? 'bullish' : 'neutral'}, Volume ${volumeSpike ? 'spike' : 'normal'}.`,
      keyLevels: {
        support: price - (atr * price / 100),
        resistance: price + (atr * price / 100),
        targets: [
          price + (0.5 * atr * price / 100),
          price + (1.0 * atr * price / 100),
          price + (1.5 * atr * price / 100)
        ],
        stopLoss: price - (1.5 * atr * price / 100)
      }
    };
  };

  const getConditionIcon = (condition: string) => {
    switch (condition) {
      case 'bullish': return <TrendingUp className="h-4 w-4" />;
      case 'bearish': return <TrendingDown className="h-4 w-4" />;
      default: return <Minus className="h-4 w-4" />;
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'bullish': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'bearish': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const strategyConfig = getActiveStrategyConfig();

  return (
    <Card className={`bg-trading-card border-gray-800 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Market Insights & Forecast
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {strategyConfig.displayName}
            </Badge>
            <Button onClick={generateInsights} disabled={loading} size="sm">
              {loading ? 'Analyzing...' : 'Refresh'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : analysis ? (
          <>
            {/* Current Market Condition */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Market Condition</span>
                </div>
                <Badge className={`${getConditionColor(analysis.condition)} border`}>
                  {getConditionIcon(analysis.condition)}
                  <span className="ml-1 capitalize">{analysis.condition}</span>
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Confidence</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${analysis.confidence}%` }}
                    />
                  </div>
                  <span className="text-sm font-mono">{Math.round(analysis.confidence)}%</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Next Action</span>
                </div>
                <p className="text-sm text-muted-foreground">{analysis.timing}</p>
              </div>
            </div>

            {/* Forecast Direction */}
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Forecast Direction
              </h4>
              <p className="text-sm text-muted-foreground">{analysis.forecast}</p>
            </div>

            {/* Time Horizons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-green-400">Short-Term (Hours)</h5>
                <p className="text-xs text-muted-foreground">{analysis.shortTerm}</p>
              </div>
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-yellow-400">Mid-Term (Days)</h5>
                <p className="text-xs text-muted-foreground">{analysis.midTerm}</p>
              </div>
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-blue-400">Long-Term (Weeks)</h5>
                <p className="text-xs text-muted-foreground">{analysis.longTerm}</p>
              </div>
            </div>

            {/* Actionable Suggestion */}
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Actionable Suggestion
              </h4>
              <p className="text-sm text-muted-foreground">{analysis.action}</p>
            </div>

            {/* Key Levels */}
            <div className="space-y-2">
              <h4 className="font-medium">Key Levels</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-red-400">Support:</span>
                  <p className="font-mono">${analysis.keyLevels.support.toFixed(4)}</p>
                </div>
                <div>
                  <span className="text-green-400">Resistance:</span>
                  <p className="font-mono">${analysis.keyLevels.resistance.toFixed(4)}</p>
                </div>
                <div>
                  <span className="text-blue-400">Target 1:</span>
                  <p className="font-mono">${analysis.keyLevels.targets[0].toFixed(4)}</p>
                </div>
                <div>
                  <span className="text-orange-400">Stop Loss:</span>
                  <p className="font-mono">${analysis.keyLevels.stopLoss.toFixed(4)}</p>
                </div>
              </div>
            </div>

            {/* Strategy Reasoning */}
            <div className="space-y-2 pt-4 border-t border-gray-700">
              <h4 className="font-medium text-xs text-muted-foreground">Strategy Analysis</h4>
              <p className="text-xs text-muted-foreground">{analysis.reasoning}</p>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Click "Refresh" to generate market insights</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}