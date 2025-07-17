import { useEffect, useRef } from 'react';
import TelegramService from '@/services/telegramService';
import { useStrategySignals } from '@/hooks/useStrategy';
import { fetchMarketData } from '@/services/binanceApi';
import EnhancedBinanceApi from '@/services/enhancedBinanceApi';
import { toast } from 'sonner';

interface UseTelegramSignalsProps {
  enabled: boolean;
  interval?: number; // in milliseconds
  symbols?: string[];
  onSignalSent?: (signal: any) => void;
}

export const useTelegramSignals = ({ 
  enabled, 
  interval = 300000, // 5 minutes
  symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'],
  onSignalSent 
}: UseTelegramSignalsProps) => {
  const { generateStrategySignal, enhanceSignalWithStrategy } = useStrategySignals();
  const telegramService = TelegramService.getInstance();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);

  const scanAndSendSignals = async () => {
    if (isProcessingRef.current || !telegramService.isEnabled()) {
      return;
    }

    isProcessingRef.current = true;

    try {
      // Get filtered symbols with high volume
      const filteredData = await EnhancedBinanceApi.fetchFilteredMarketData({
        minimumVolume: 100000,
        minimumPriceChange: 2,
        maxResults: 20
      });

      const highVolumeSymbols = filteredData.slice(0, 10).map(ticker => ticker.symbol);
      const symbolsToScan = [...new Set([...symbols, ...highVolumeSymbols])];

      for (const symbol of symbolsToScan) {
        try {
          // Fetch market data
          const marketData = await fetchMarketData(symbol);
          if (!marketData) continue;

          // Generate strategy signal
          const strategyResult = await generateStrategySignal(symbol, marketData);
          if (!strategyResult) continue;

          const signal = enhanceSignalWithStrategy(strategyResult.signal);
          
          // Only send high confidence signals
          if (signal.confidence < 0.7) continue;

          // Format signal for Telegram
          const telegramSignal = {
            type: signal.type,
            symbol: signal.symbol,
            strategyName: signal.strategyName,
            entryPrice: signal.entryPrice,
            entryRange: { min: signal.entryPrice * 0.995, max: signal.entryPrice * 1.005 },
            stopLoss: signal.stopLoss,
            takeProfit: signal.targets?.[0] || signal.entryPrice * 1.05,
            targets: signal.targets || [signal.entryPrice * 1.03, signal.entryPrice * 1.05, signal.entryPrice * 1.08],
            confidence: signal.confidence,
            leverage: signal.leverage || 1,
            timestamp: new Date().toISOString()
          };

          // Send to Telegram
          const result = await telegramService.sendSignal(telegramSignal);
          
          if (result.success) {
            console.log(`Auto-signal sent for ${symbol}: ${signal.type} at ${signal.entryPrice}`);
            onSignalSent?.(signal);
          } else if (result.error !== 'Duplicate signal prevented') {
            console.warn(`Failed to send auto-signal for ${symbol}:`, result.error);
          }

          // Add small delay between signals to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Error processing signal for ${symbol}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in auto signal scanning:', error);
    } finally {
      isProcessingRef.current = false;
    }
  };

  useEffect(() => {
    if (enabled && telegramService.isEnabled()) {
      // Start scanning immediately
      scanAndSendSignals();
      
      // Set up interval for automatic scanning
      intervalRef.current = setInterval(scanAndSendSignals, interval);
      
      toast.info('Auto Telegram signals enabled', {
        description: `Scanning every ${Math.floor(interval / 60000)} minutes`
      });
    } else {
      // Clear interval when disabled
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, interval, telegramService.isEnabled()]);

  return {
    isScanning: isProcessingRef.current,
    scanNow: scanAndSendSignals
  };
};