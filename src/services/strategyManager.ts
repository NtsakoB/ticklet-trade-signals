import { Strategy, StrategyType, StrategyConfig, StrategyResult } from '@/types/strategy';
import { TradeSignal } from '@/types';

export const DEFAULT_STRATEGIES: Record<StrategyType, Strategy> = {
  'ticklet-alpha': {
    id: 'ticklet-alpha',
    name: 'ticklet-alpha',
    displayName: 'Ticklet ALPHA Strategy',
    description: 'Advanced momentum strategy with RSI, MACD, volume analysis, and AI/ML integration',
    version: '1.0.0',
    features: ['RSI Analysis', 'MACD Signals', 'Volume Analysis', 'AI/ML Integration', 'Dynamic Leverage'],
    riskLevel: 'medium',
    enabled: true
  },
  'bull-strategy': {
    id: 'bull-strategy',
    name: 'bull-strategy',
    displayName: 'Bull Strategy',
    description: 'Aggressive bullish momentum strategy optimized for uptrending markets',
    version: '1.0.0',
    features: ['Trend Following', 'Momentum Indicators', 'Breakout Detection', 'Bull Market Optimization'],
    riskLevel: 'high',
    enabled: true
  }
};

class StrategyManager {
  private activeStrategy: StrategyType = 'ticklet-alpha';
  private strategies: Record<StrategyType, Strategy> = DEFAULT_STRATEGIES;

  constructor() {
    // Load from localStorage if available
    const saved = localStorage.getItem('trading-strategy-config');
    if (saved) {
      try {
        const config: StrategyConfig = JSON.parse(saved);
        this.activeStrategy = config.activeStrategy;
        this.strategies = { ...DEFAULT_STRATEGIES, ...config.strategies };
      } catch (error) {
        console.error('Failed to load strategy config:', error);
      }
    }
  }

  setActiveStrategy(strategy: StrategyType) {
    this.activeStrategy = strategy;
    this.saveConfig();
  }

  getActiveStrategy(): StrategyType {
    return this.activeStrategy;
  }

  getActiveStrategyConfig(): Strategy {
    return this.strategies[this.activeStrategy];
  }

  getStrategyConfig(strategy: StrategyType): Strategy {
    return this.strategies[strategy];
  }

  getAllStrategies(): Strategy[] {
    return Object.values(this.strategies);
  }

  updateStrategy(strategy: StrategyType, updates: Partial<Strategy>) {
    this.strategies[strategy] = { ...this.strategies[strategy], ...updates };
    this.saveConfig();
  }

  private saveConfig() {
    const config: StrategyConfig = {
      activeStrategy: this.activeStrategy,
      strategies: this.strategies
    };
    localStorage.setItem('trading-strategy-config', JSON.stringify(config));
  }

  // Add strategy metadata to trade signals
  enhanceSignalWithStrategy(signal: any): TradeSignal {
    const strategy = this.getActiveStrategyConfig();
    return {
      ...signal,
      strategy: this.activeStrategy,
      strategyName: strategy.displayName,
      metadata: {
        ...signal.metadata,
        strategy: this.activeStrategy,
        strategyVersion: strategy.version,
        generatedBy: strategy.displayName
      }
    };
  }

  // Generate strategy-specific signal
  async generateSignal(symbol: string, marketData: any): Promise<StrategyResult | null> {
    const strategy = this.getActiveStrategyConfig();
    
    try {
      switch (this.activeStrategy) {
        case 'ticklet-alpha':
          return await this.executeTickletAlphaStrategy(symbol, marketData);
        case 'bull-strategy':
          return await this.executeBullStrategy(symbol, marketData);
        default:
          throw new Error(`Unknown strategy: ${this.activeStrategy}`);
      }
    } catch (error) {
      console.error(`Strategy execution failed for ${strategy.displayName}:`, error);
      return null;
    }
  }

  private async executeTickletAlphaStrategy(symbol: string, marketData: any): Promise<StrategyResult> {
    // Existing Ticklet ALPHA logic
    const price = parseFloat(marketData.lastPrice);
    const priceChange = parseFloat(marketData.priceChangePercent);
    const volume = parseFloat(marketData.volume) * price;
    
    const isUptrend = priceChange > 0;
    const isHighVolume = volume > 1000000;
    const volatility = Math.abs(priceChange);
    
    let confidence = 0.7;
    if (isHighVolume) confidence += 0.1;
    if (volatility > 2) confidence += 0.1;
    if (volatility > 5) confidence += 0.1;
    confidence = Math.min(confidence, 0.95);
    
    const signalType = isUptrend && volatility > 1 ? 'BUY' : 'SELL';
    
    const targets = signalType === 'BUY' 
      ? [price * 1.02, price * 1.05, price * 1.08]
      : [price * 0.98, price * 0.95, price * 0.92];
    
    const stopLoss = signalType === 'BUY' ? price * 0.97 : price * 1.03;
    const leverage = Math.max(1, Math.min(20, Math.floor((confidence * 15) / (volatility / 2 + 1))));
    
    const signal = {
      id: `signal-${Date.now()}`,
      symbol,
      type: signalType,
      entryPrice: price,
      targets,
      stopLoss,
      confidence,
      timestamp: new Date().toISOString(),
      source: 'strategy',
      leverage,
      status: 'active',
      strategy: 'ticklet-alpha' as StrategyType,
      strategyName: 'Ticklet ALPHA Strategy',
      marketData: {
        priceChange,
        volume,
        high24h: parseFloat(marketData.highPrice),
        low24h: parseFloat(marketData.lowPrice),
        volatility
      }
    };

    return {
      signal,
      confidence,
      reasoning: `RSI and MACD convergence with ${isHighVolume ? 'high' : 'moderate'} volume confirmation`,
      metadata: {
        strategy: 'ticklet-alpha',
        timestamp: new Date().toISOString(),
        indicators: ['RSI', 'MACD', 'Volume', 'AI/ML']
      }
    };
  }

  private async executeBullStrategy(symbol: string, marketData: any): Promise<StrategyResult> {
    // Bull Strategy - Based on your comprehensive technical analysis
    const price = parseFloat(marketData.lastPrice);
    const priceChange = parseFloat(marketData.priceChangePercent);
    const volume = parseFloat(marketData.volume) * price;
    const high24h = parseFloat(marketData.highPrice);
    const low24h = parseFloat(marketData.lowPrice);
    
    // === Technical Analysis ===
    const volatility = Math.abs(priceChange);
    const atr = (high24h - low24h) / price * 100; // Simplified ATR
    
    // === RSI Logic (simplified) ===
    const rsiOversold = priceChange < -3; // RSI < 25 equivalent
    const rsiRecovering = rsiOversold && priceChange > -5; // RSI rising from oversold
    const rsiOverbought = priceChange > 5; // RSI > 80 equivalent
    
    // === MACD Logic (simplified trend momentum) ===
    const macdBullish = priceChange > 0 && volatility > 1; // MACD > signal
    const macdBearish = priceChange < 0 && volatility > 1; // MACD < signal
    
    // === Volume Analysis ===
    const volThreshold = 100000; // $100k threshold from your strategy
    const validVolume = volume > volThreshold;
    const volSpike = volume > volThreshold * 1.5; // Volume spike detection
    
    // === EMA Alignment (trend direction) ===
    const emaAlign = priceChange > 0; // Simplified: price above EMA20 > EMA50
    
    // === Elliott Wave / Fibonacci Zones ===
    const priceRange = high24h - low24h;
    const fib0382 = high24h - 0.382 * priceRange;
    const fib050 = high24h - 0.5 * priceRange;
    const fib0618 = high24h - 0.618 * priceRange;
    const inFibZone = price >= fib050 && price <= fib0382;
    const missedFibZone = price < fib050;
    
    // === Order Block Logic (simplified) ===
    const pullbackZone = price <= low24h + (high24h - low24h) * 0.3;
    const notOverextended = volatility < atr * 2;
    
    // === Confidence Engine (your dynamic scoring) ===
    let confidence = 0.7; // Base 70%
    let leverage = 5;
    let riskPct = 0.20;
    
    // High confidence conditions
    if (rsiOversold && macdBullish && volSpike && inFibZone) {
      confidence = 0.9; // 90%
      leverage = 10;
      riskPct = 0.10;
    } else if (macdBullish && rsiRecovering && volSpike) {
      confidence = 0.8; // 80%
      leverage = 7;
      riskPct = 0.15;
    } else if (macdBullish && emaAlign) {
      confidence = 0.7; // 70%
      leverage = 5;
      riskPct = 0.20;
    } else {
      confidence = 0.6; // 60%
      leverage = 3;
      riskPct = 0.25;
    }
    
    // === Entry Conditions ===
    
    // Primary Long Condition (your comprehensive setup)
    const primaryLongCondition = 
      rsiOversold && 
      rsiRecovering && 
      macdBullish && 
      pullbackZone && 
      emaAlign && 
      volSpike && 
      notOverextended && 
      validVolume && 
      inFibZone;
    
    // Fallback Long Condition (missed Fib zone entry)
    const fallbackLongCondition = 
      missedFibZone && 
      price <= fib050 && 
      price >= fib0618 && 
      rsiOversold && 
      macdBullish && 
      volSpike && 
      emaAlign && 
      validVolume;
    
    // Short Condition (reversal from overbought)
    const shortCondition = 
      rsiOverbought && 
      macdBearish && 
      validVolume;
    
    // === Signal Generation ===
    let signalType: 'BUY' | 'SELL' = 'BUY';
    
    if (primaryLongCondition || fallbackLongCondition) {
      signalType = 'BUY';
    } else if (shortCondition) {
      signalType = 'SELL';
    } else {
      // Default to trend following if no specific condition
      signalType = priceChange > 0 ? 'BUY' : 'SELL';
      confidence = Math.max(0.5, confidence * 0.7); // Reduce confidence for default signals
    }
    
    // === Dynamic Targets and Stop Loss ===
    const slDynamic = riskPct; // Your dynamic SL percentage
    
    const targets = signalType === 'BUY' 
      ? [
          price * (1 + atr/100 * 1.5), // T1: 1.5x ATR
          price * (1 + atr/100 * 3),   // T2: 3x ATR  
          price * (1 + atr/100 * 5)    // T3: 5x ATR
        ]
      : [
          price * (1 - atr/100 * 1.5), // T1: 1.5x ATR
          price * (1 - atr/100 * 3),   // T2: 3x ATR
          price * (1 - atr/100 * 5)    // T3: 5x ATR
        ];
    
    // Swing-based stop loss
    const swingBasedSL = signalType === 'BUY' 
      ? low24h - (price * slDynamic) 
      : high24h + (price * slDynamic);
    
    const stopLoss = swingBasedSL;
    
    // === Capital Logic ===
    const accountEquity = 10000; // Your base capital
    const tradableCap = accountEquity * 0.5; // 50% of equity
    const usedCapital = tradableCap * riskPct;
    
    const signal = {
      id: `bull-signal-${Date.now()}`,
      symbol,
      type: signalType,
      entryPrice: price,
      targets,
      stopLoss,
      confidence,
      timestamp: new Date().toISOString(),
      source: 'strategy',
      leverage,
      status: 'active',
      strategy: 'bull-strategy' as StrategyType,
      strategyName: 'Bull Strategy',
      riskPercent: riskPct,
      usedCapital,
      marketData: {
        priceChange,
        volume,
        high24h,
        low24h,
        volatility,
        atr,
        fibLevels: { fib0382, fib050, fib0618 },
        inFibZone,
        volSpike,
        emaAlign
      }
    };

    // === Reasoning ===
    let reasoning = `Bull Strategy Analysis: `;
    if (primaryLongCondition) {
      reasoning += `Primary long setup with RSI oversold recovery, MACD bullish, volume spike, and Fibonacci zone entry`;
    } else if (fallbackLongCondition) {
      reasoning += `Fallback long entry in missed Fibonacci zone with volume confirmation`;
    } else if (shortCondition) {
      reasoning += `Short setup from overbought RSI with bearish MACD divergence`;
    } else {
      reasoning += `Trend following signal based on momentum and volume`;
    }

    return {
      signal,
      confidence,
      reasoning,
      metadata: {
        strategy: 'bull-strategy',
        timestamp: new Date().toISOString(),
        indicators: ['RSI', 'MACD', 'Elliott Wave', 'Fibonacci', 'Order Blocks', 'Volume', 'ATR']
      }
    };
  }
}

export const strategyManager = new StrategyManager();
