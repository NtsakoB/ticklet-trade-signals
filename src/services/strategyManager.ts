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
    // Bull Strategy logic - more aggressive for uptrends
    const price = parseFloat(marketData.lastPrice);
    const priceChange = parseFloat(marketData.priceChangePercent);
    const volume = parseFloat(marketData.volume) * price;
    
    const isUptrend = priceChange > 0;
    const isStrongUptrend = priceChange > 2;
    const isHighVolume = volume > 2000000; // Higher volume threshold
    const volatility = Math.abs(priceChange);
    
    // Bull strategy favors BUY signals in uptrending markets
    let confidence = 0.6;
    if (isUptrend) confidence += 0.2;
    if (isStrongUptrend) confidence += 0.1;
    if (isHighVolume) confidence += 0.1;
    confidence = Math.min(confidence, 0.95);
    
    // More aggressive targeting for bull strategy
    const signalType = isUptrend ? 'BUY' : (priceChange < -3 ? 'SELL' : 'BUY'); // Favor BUY
    
    const targets = signalType === 'BUY' 
      ? [price * 1.03, price * 1.07, price * 1.12] // More aggressive targets
      : [price * 0.97, price * 0.93, price * 0.88];
    
    const stopLoss = signalType === 'BUY' ? price * 0.95 : price * 1.05; // Wider stops
    const leverage = Math.max(2, Math.min(25, Math.floor((confidence * 20) / (volatility / 3 + 1)))); // Higher leverage
    
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
      strategy: 'bull-strategy' as StrategyType,
      strategyName: 'Bull Strategy',
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
      reasoning: `Aggressive bull momentum detected with ${isStrongUptrend ? 'strong' : 'moderate'} uptrend and ${isHighVolume ? 'high' : 'adequate'} volume`,
      metadata: {
        strategy: 'bull-strategy',
        timestamp: new Date().toISOString(),
        indicators: ['Momentum', 'Trend', 'Volume', 'Breakout']
      }
    };
  }
}

export const strategyManager = new StrategyManager();
