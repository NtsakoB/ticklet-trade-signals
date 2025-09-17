export type StrategyType = 'ticklet-alpha' | 'bull-strategy' | 'jam-bot' | 'golden-hook' | 'market-regime' | 'condition-strategy';

export interface Strategy {
  id: StrategyType;
  name: string;
  displayName: string;
  description: string;
  version: string;
  features: string[];
  riskLevel: 'low' | 'medium' | 'high';
  enabled: boolean;
}

export interface StrategyConfig {
  activeStrategy: StrategyType;
  strategies: Record<StrategyType, Strategy>;
}

export interface StrategyResult {
  signal: any;
  confidence: number;
  reasoning: string;
  metadata: {
    strategy: StrategyType;
    timestamp: string;
    indicators: string[];
  };
}

export interface StrategyContext {
  activeStrategy: StrategyType;
  setActiveStrategy: (strategy: StrategyType) => void;
  getStrategyConfig: (strategy: StrategyType) => Strategy;
  getAllStrategies: () => Strategy[];
  getActiveStrategyConfig: () => Strategy;
}