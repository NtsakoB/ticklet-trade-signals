import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { type StrategyType, type Strategy, type StrategyContext as StrategyContextType } from '@/types/strategy';
import { strategyManager } from '@/services/strategyManager';

const StrategyContext = createContext<StrategyContextType | undefined>(undefined);

interface StrategyProviderProps {
  children: ReactNode;
}

export function StrategyProvider({ children }: StrategyProviderProps) {
  const [activeStrategy, setActiveStrategy] = useState<StrategyType>(
    strategyManager.getActiveStrategy()
  );

  const handleStrategyChange = (strategy: StrategyType) => {
    setActiveStrategy(strategy);
    strategyManager.setActiveStrategy(strategy);
  };

  const getStrategyConfig = (strategy: StrategyType): Strategy => {
    return strategyManager.getStrategyConfig(strategy);
  };

  const getAllStrategies = (): Strategy[] => {
    return strategyManager.getAllStrategies();
  };

  const contextValue: StrategyContextType = {
    activeStrategy,
    setActiveStrategy: handleStrategyChange,
    getStrategyConfig,
    getAllStrategies
  };

  return (
    <StrategyContext.Provider value={contextValue}>
      {children}
    </StrategyContext.Provider>
  );
}

export function useStrategy(): StrategyContextType {
  const context = useContext(StrategyContext);
  if (context === undefined) {
    throw new Error('useStrategy must be used within a StrategyProvider');
  }
  return context;
}

// Hook for getting strategy-enhanced signals
export function useStrategySignals() {
  const { activeStrategy } = useStrategy();
  
  const enhanceSignalWithStrategy = (signal: any) => {
    return strategyManager.enhanceSignalWithStrategy(signal);
  };

  const generateStrategySignal = async (symbol: string, marketData: any) => {
    return await strategyManager.generateSignal(symbol, marketData);
  };

  return {
    activeStrategy,
    enhanceSignalWithStrategy,
    generateStrategySignal
  };
}