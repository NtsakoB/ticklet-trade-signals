import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import StorageService from '@/services/storageService';

export interface TradeModeState {
  // Existing strategy state (adapting to current useStrategy)
  strategy: string;
  
  // New leverage controls
  dynamicLeverageEnabled: boolean;
  manualLeverage: number;
  
  // Actions
  setStrategy: (strategy: string) => void;
  setDynamicLeverageEnabled: (enabled: boolean) => void;
  setManualLeverage: (leverage: number) => void;
  
  // Helper method to get current settings for backtest
  getSettings: () => {
    minVolume: number;
    minPriceChange: number;
    maxSignals: number;
    minConfidence: number;
  };
}

export const useTradeModeStore = create<TradeModeState>()(
  persist(
    (set, get) => ({
      // Default values
      strategy: 'TickletAlpha',
      dynamicLeverageEnabled: true,
      manualLeverage: 10,
      
      // Actions
      setStrategy: (strategy: string) => {
        set({ strategy });
        // Sync with existing StorageService for backwards compatibility
        const settings = StorageService.getSettings();
        StorageService.saveSettings({ ...settings, strategy });
      },
      
      setDynamicLeverageEnabled: (enabled: boolean) => {
        set({ dynamicLeverageEnabled: enabled });
        const settings = StorageService.getSettings();
        StorageService.saveSettings({ 
          ...settings, 
          dynamicLeverage: enabled 
        });
      },
      
      setManualLeverage: (leverage: number) => {
        const clampedLeverage = Math.max(1, Math.min(20, leverage));
        set({ manualLeverage: clampedLeverage });
        const settings = StorageService.getSettings();
        StorageService.saveSettings({ 
          ...settings, 
          leverage: clampedLeverage 
        });
      },
      
      // Helper method for backtesting
      getSettings: () => {
        const state = get();
        const settings = StorageService.getSettings();
        return {
          minVolume: settings.minVolume || 50000,
          minPriceChange: settings.minPriceChange || 1.0,
          maxSignals: settings.maxSignals || 100,
          minConfidence: settings.minConfidence || 30,
        };
      },
    }),
    {
      name: 'trade-mode-storage',
      partialize: (state) => ({
        strategy: state.strategy,
        dynamicLeverageEnabled: state.dynamicLeverageEnabled,
        manualLeverage: state.manualLeverage,
      }),
    }
  )
);
