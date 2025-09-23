
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import StatsCards from "@/components/StatsCards";
import SignalTable from "@/components/SignalTable";
import RecentSignals from "@/components/RecentSignals";
import OpenTrades from "@/components/OpenTrades";
import AiLearningChart from "@/components/AiLearningChart";
import TotalBalance from "@/components/TotalBalance";
import ProjectionChart from "@/components/ProjectionChart";
import AiInsights from "@/components/AiInsights";
import BacktestPanel from "@/components/Backtest/BacktestPanel";
import TradingViewChart from "@/components/TradingViewChart";
import SignalGenerator from "@/components/SignalGenerator";
import PaperTradingPanel from "@/components/PaperTradingPanel";
import AiStrategyOptimization from "@/components/AiStrategyOptimization";
import MarketSummary from "@/components/MarketSummary";
import SecuritySettings from "@/components/SecuritySettings";
import LeverageControls from "@/components/TradingControls/LeverageControls";
import TradeLogPanel from "@/components/TradeLog/TradeLogPanel";
import { StrategySelector } from "@/components/ui/strategy-selector";
import { SymbolSelector } from "@/components/SymbolSelector";
import { MarketInsights } from "@/components/MarketInsights";
import { LowEntryWatchlist } from "@/components/InsightPanels/LowEntryWatchlist";
import { LowestPriceNow } from "@/components/InsightPanels/LowestPriceNow";
import { MissedOpportunities } from "@/components/InsightPanels/MissedOpportunities";
import OverviewPanel from "@/components/Overview/OverviewPanel";
import LiveSignalControls from "@/components/LiveSignalControls";
import { useStrategy } from "@/hooks/useStrategy";
import { useTelegramSignals } from "@/hooks/useTelegramSignals";
import TelegramService from "@/services/telegramService";
import { fetchMultipleSymbols, convertToSignals, calculateDashboardStats, generateProjections } from "@/services/binanceApi";
import EnhancedBinanceApi from "@/services/enhancedBinanceApi";
import StorageService from "@/services/storageService";
import PaperTradingService from "@/services/paperTradingService";
import { DashboardStats, TradeSignal } from "@/types";

const Index = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'trades' | 'logs' | 'projections' | 'ai' | 'backtest' | 'controls' | 'paper' | 'optimization' | 'market' | 'security' | 'chart'>('overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const { activeStrategy, setActiveStrategy, getAllStrategies } = useStrategy();
  const telegramService = TelegramService.getInstance();
  
  // Auto Telegram signals for background scanning
  const { isScanning } = useTelegramSignals({
    enabled: telegramService.isEnabled(),
    interval: 300000, // 5 minutes
    symbols: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'],
    onSignalSent: (signal) => {
      console.log('Background signal sent:', signal);
    }
  });
  
  // Listen for strategy changes to refresh all data
  useEffect(() => {
    const handleStrategyChange = () => {
      setRefreshKey(prev => prev + 1);
    };
    
    window.addEventListener('strategyChanged', handleStrategyChange);
    return () => window.removeEventListener('strategyChanged', handleStrategyChange);
  }, []);
  
  // Signal filtering parameters
  const [minimumVolume, setMinimumVolume] = useState(50000);
  const [minimumPriceChange, setMinimumPriceChange] = useState(1);
  const [maxSignals, setMaxSignals] = useState(50);
  const [minimumConfidence, setMinimumConfidence] = useState(0.3);
  
  // Projection days setting
  const [projectionDays, setProjectionDays] = useState(30);
  
  // Leverage control (legacy - now handled by LeverageControls component)
  const [currentLeverage, setCurrentLeverage] = useState(10);
  const [dynamicLeverage, setDynamicLeverage] = useState(false);
  
  // Selected symbol for chart
  const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");

  // Fetch enhanced real data from Binance with filtering
  const { data: binanceData, isLoading, isError } = useQuery({
    queryKey: ['enhancedBinanceData', minimumVolume, minimumPriceChange, maxSignals],
    queryFn: () => EnhancedBinanceApi.fetchFilteredMarketData({
      minimumVolume,
      minimumPriceChange,
      maxResults: maxSignals
    }),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Convert to signals using enhanced API, filtered by active strategy
  const signals = isError || !binanceData 
    ? []
    : EnhancedBinanceApi.convertToSignals(binanceData, {
        minimumConfidence,
        includeAnomaly: true
      }).map(signal => ({
        ...signal,
        strategy: activeStrategy,
        metadata: {
          ...signal.metadata,
          strategy: activeStrategy,
          timestamp: new Date().toISOString(),
          indicators: [`${activeStrategy}-indicators`]
        }
      }));
  
  // Calculate stats based on real stored data, filtered by active strategy
  const calculateRealStats = (): DashboardStats => {
    const storedTrades = StorageService.getTrades()
      .filter(trade => trade.strategy === activeStrategy || !trade.strategy); // Include legacy trades without strategy
    const openTrades = storedTrades.filter(t => t.status === 'open');
    const closedTrades = storedTrades.filter(t => t.status === 'closed');
    
    const actualWinRate = closedTrades.length > 0 
      ? (closedTrades.filter(t => (t.pnl || 0) > 0).length / closedTrades.length) 
      : 0.5;
    const totalPnL = closedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    
    // Calculate capital at risk from open trades
    const capitalAtRisk = openTrades.reduce((sum, trade) => {
      return sum + (trade.quantity * trade.entryPrice * trade.leverage);
    }, 0);
    
    // Get paper trading balance
    const paperBalance = PaperTradingService.getPaperBalance();
    
    // Generate performance history from stored trades
    const performanceHistory = generatePerformanceHistory(closedTrades, paperBalance);
    
    return {
      activeSignals: signals.length,
      executedTrades: closedTrades.length,
      winRate: actualWinRate,
      capitalAtRisk,
      totalBalance: paperBalance,
      startingBalance: 10000,
      performanceHistory
    };
  };

  const generatePerformanceHistory = (trades: any[], currentBalance: number) => {
    // Generate last 30 days of performance based on actual trades
    const days = 30;
    const history = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Find trades on this date
      const dayTrades = trades.filter(trade => {
        const tradeDate = new Date(trade.exitTime || trade.entryTime);
        return tradeDate.toDateString() === date.toDateString();
      });
      
      const dayPnL = dayTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
      const winCount = dayTrades.filter(t => (t.pnl || 0) > 0).length;
      const dayWinRate = dayTrades.length > 0 ? winCount / dayTrades.length : 0.5;
      
      // Calculate cumulative balance (simplified)
      const balanceChange = i === 0 ? currentBalance : currentBalance - (dayPnL * (i / 10));
      
      history.push({
        date: date.toISOString().split('T')[0],
        balance: Math.max(balanceChange, currentBalance * 0.8), // Prevent negative balance
        winRate: dayWinRate,
        tradesCount: dayTrades.length
      });
    }
    
    return history;
  };

  const stats = calculateRealStats();

  // Calculate projections based on actual historical performance
  const projections = generateProjections(projectionDays, stats);
  
  // Recent signals - use actual signals
  const recent = signals.slice(0, 10);
  
  // Convert stored trades to the format expected by TradeLog, filtered by active strategy
  const storedTrades = StorageService.getTrades()
    .filter(trade => trade.status === 'closed')
    .filter(trade => trade.strategy === activeStrategy || !trade.strategy) // Include legacy trades
    .slice(0, 10)
    .map(trade => ({
      id: trade.id,
      symbol: trade.symbol,
      side: trade.type,
      pnl: trade.pnl || 0,
      timestamp: trade.exitTime || trade.entryTime,
      status: 'completed' as const,
      strategy: trade.strategy || activeStrategy
    }));

  const handleSignalGenerated = async (signal: any) => {
    console.log('New signal generated:', signal);
    setSelectedSymbol(signal.symbol);
    
    // Auto-execute as paper trade if enabled
    try {
      await PaperTradingService.executePaperTrade(signal);
    } catch (error) {
      console.error('Failed to execute paper trade:', error);
    }
  };

  const handleTradeExecuted = (trade: any) => {
    console.log('Trade executed:', trade);
  };

  // Legacy leverage handlers - kept for backward compatibility but not used by new components
  const handleLeverageChange = (leverage: number) => {
    setCurrentLeverage(leverage);
    
    // Save settings
    const settings = StorageService.getSettings();
    StorageService.saveSettings({
      ...settings,
      leverage,
      dynamicLeverage
    });
  };

  const handleDynamicLeverageToggle = () => {
    const newDynamicLeverage = !dynamicLeverage;
    setDynamicLeverage(newDynamicLeverage);
    
    // Save settings
    const settings = StorageService.getSettings();
    StorageService.saveSettings({
      ...settings,
      dynamicLeverage: newDynamicLeverage
    });
  };

  return (
    <div className="min-h-screen bg-trading-bg">
      <Header />
      
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-6">Advanced Trading Dashboard</h1>
        
        <div className="space-y-6">
          {/* Status indicator for data source */}
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isError ? 'bg-red-500' : 'bg-green-500'}`}></div>
            <span className="text-sm text-muted-foreground">
              {isError ? 'API Error - Check connection' : 'Connected to Binance API (Real Data)'}
              {isLoading && ' (refreshing...)'}
            </span>
          </div>
          
          {/* Total Balance */}
          <TotalBalance 
            balance={stats.totalBalance || 10000} 
            startingBalance={stats.startingBalance}
            performanceHistory={stats.performanceHistory}
          />
          
          {/* Strategy Selector */}
          <StrategySelector 
            activeStrategy={activeStrategy}
            strategies={getAllStrategies()}
            onStrategyChange={setActiveStrategy}
            variant="compact"
            className="mb-4"
          />

          {/* Stats Cards */}
          <StatsCards stats={stats} />
          
          {/* Tab buttons */}
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'overview' ? 'bg-primary text-white' : 'bg-gray-800 text-muted-foreground hover:bg-gray-700'}`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('chart')}
              className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'chart' ? 'bg-primary text-white' : 'bg-gray-800 text-muted-foreground hover:bg-gray-700'}`}
            >
              Chart
            </button>
            <button 
              onClick={() => setActiveTab('trades')}
              className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'trades' ? 'bg-primary text-white' : 'bg-gray-800 text-muted-foreground hover:bg-gray-700'}`}
            >
              Open Trades
            </button>
            <button 
              onClick={() => setActiveTab('paper')}
              className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'paper' ? 'bg-primary text-white' : 'bg-gray-800 text-muted-foreground hover:bg-gray-700'}`}
            >
              Paper Trading
            </button>
            <button 
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'logs' ? 'bg-primary text-white' : 'bg-gray-800 text-muted-foreground hover:bg-gray-700'}`}
            >
              Trade Log
            </button>
            <button 
              onClick={() => setActiveTab('backtest')}
              className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'backtest' ? 'bg-primary text-white' : 'bg-gray-800 text-muted-foreground hover:bg-gray-700'}`}
            >
              Backtest Results
            </button>
            <button 
              onClick={() => setActiveTab('projections')}
              className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'projections' ? 'bg-primary text-white' : 'bg-gray-800 text-muted-foreground hover:bg-gray-700'}`}
            >
              Projections
            </button>
            <button 
              onClick={() => setActiveTab('controls')}
              className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'controls' ? 'bg-primary text-white' : 'bg-gray-800 text-muted-foreground hover:bg-gray-700'}`}
            >
              Trading Controls
            </button>
            <button 
              onClick={() => setActiveTab('ai')}
              className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'ai' ? 'bg-primary text-white' : 'bg-gray-800 text-muted-foreground hover:bg-gray-700'}`}
            >
              AI Analytics
            </button>
            <button 
              onClick={() => setActiveTab('optimization')}
              className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'optimization' ? 'bg-primary text-white' : 'bg-gray-800 text-muted-foreground hover:bg-gray-700'}`}
            >
              AI Optimization
            </button>
            <button 
              onClick={() => setActiveTab('market')}
              className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'market' ? 'bg-primary text-white' : 'bg-gray-800 text-muted-foreground hover:bg-gray-700'}`}
            >
              Market Summary
            </button>
            <button 
              onClick={() => setActiveTab('security')}
              className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'security' ? 'bg-primary text-white' : 'bg-gray-800 text-muted-foreground hover:bg-gray-700'}`}
            >
              Security
            </button>
          </div>
          
          {/* Signal filtering controls */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-gray-800/50">
            <div>
              <span className="text-sm text-muted-foreground">Min Volume: ${minimumVolume.toLocaleString()}</span>
              <input 
                type="range" 
                min="10000" 
                max="1000000" 
                step="10000"
                value={minimumVolume}
                onChange={(e) => setMinimumVolume(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Min Price Change: {minimumPriceChange}%</span>
              <input 
                type="range" 
                min="0.5" 
                max="10" 
                step="0.5"
                value={minimumPriceChange}
                onChange={(e) => setMinimumPriceChange(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Max Signals: {maxSignals}</span>
              <input 
                type="range" 
                min="10" 
                max="100" 
                step="10"
                value={maxSignals}
                onChange={(e) => setMaxSignals(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Min Confidence: {(minimumConfidence * 100).toFixed(0)}%</span>
              <input 
                type="range" 
                min="0.1" 
                max="0.9" 
                step="0.1"
                value={minimumConfidence}
                onChange={(e) => setMinimumConfidence(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
          
          {/* Main content based on active tab */}
          <div>
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <LiveSignalControls />
                <OverviewPanel />
              </div>
            )}
            
            {activeTab === 'chart' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Trading Chart</h2>
                  <SymbolSelector
                    value={selectedSymbol}
                    onValueChange={setSelectedSymbol}
                  />
                </div>
                <TradingViewChart symbol={selectedSymbol} height={600} />
                <MarketInsights symbol={selectedSymbol} />
              </div>
            )}
            
            {activeTab === 'trades' && (
              <div className="space-y-6">
                <OpenTrades trades={signals} />
              </div>
            )}
            
            {activeTab === 'paper' && (
              <PaperTradingPanel />
            )}
            
            {activeTab === 'logs' && (
              <TradeLogPanel />
            )}
            
            {activeTab === 'backtest' && (
              <BacktestPanel />
            )}
            
            {activeTab === 'projections' && (
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Projection Days: {projectionDays}</span>
                  <input 
                    type="range" 
                    min="7" 
                    max="100" 
                    step="1"
                    value={projectionDays}
                    onChange={(e) => setProjectionDays(parseInt(e.target.value))}
                    className="w-64"
                  />
                </div>
                <ProjectionChart 
                  performanceHistory={stats.performanceHistory}
                  projections={projections}
                  stats={stats}
                />
              </div>
            )}
            
            {activeTab === 'controls' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <StrategySelector 
                    activeStrategy={activeStrategy}
                    strategies={getAllStrategies()}
                    onStrategyChange={setActiveStrategy}
                    variant="full"
                  />
                  <SignalGenerator 
                    onSignalGenerated={handleSignalGenerated}
                    onTradeExecuted={handleTradeExecuted}
                    minimumVolume={minimumVolume}
                    minimumPriceChange={minimumPriceChange}
                    maxSignals={maxSignals}
                    minimumConfidence={minimumConfidence}
                  />
                </div>
                <div className="space-y-4">
                  <LeverageControls />
                </div>
              </div>
            )}
            
            {activeTab === 'ai' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AiLearningChart />
                <AiInsights />
              </div>
            )}
            
            {activeTab === 'optimization' && (
              <AiStrategyOptimization />
            )}
            
            {activeTab === 'market' && (
              <MarketSummary />
            )}
            
            {activeTab === 'security' && (
              <SecuritySettings />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
