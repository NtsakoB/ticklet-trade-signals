
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import StatsCards from "@/components/StatsCards";
import SignalTable from "@/components/SignalTable";
import RecentSignals from "@/components/RecentSignals";
import TradeLog from "@/components/TradeLog";
import OpenTrades from "@/components/OpenTrades";
import AiLearningChart from "@/components/AiLearningChart";
import TotalBalance from "@/components/TotalBalance";
import ProjectionChart from "@/components/ProjectionChart";
import AiInsights from "@/components/AiInsights";
import BacktestResults from "@/components/BacktestResults";
import TradingViewChart from "@/components/TradingViewChart";
import LeverageControl from "@/components/LeverageControl";
import SignalGenerator from "@/components/SignalGenerator";
import { mockSignals, recentSignals, generateMockStats, completedTrades } from "@/services/mockData";
import { fetchMultipleSymbols, convertToSignals, calculateDashboardStats, generateProjections } from "@/services/binanceApi";
import { DashboardStats, TradeSignal } from "@/types";

const Index = () => {
  // State for when we fall back to mock data
  const [useMockData, setUseMockData] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'trades' | 'logs' | 'projections' | 'ai' | 'backtest' | 'controls'>('overview');
  
  // Minimum volume filter - default to $50,000
  const [minimumVolume, setMinimumVolume] = useState(50000);
  
  // Projection days setting
  const [projectionDays, setProjectionDays] = useState(30);
  
  // Leverage control
  const [currentLeverage, setCurrentLeverage] = useState(10);
  
  // Selected symbol for chart
  const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");

  // Fetch real data from Binance
  const { data: binanceData, isLoading, isError } = useQuery({
    queryKey: ['binanceData', minimumVolume],
    queryFn: () => fetchMultipleSymbols(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Convert to signals or use mock data, and apply minimum volume filter
  const signals = useMockData || isError || !binanceData 
    ? mockSignals.filter(signal => (signal.volume || 0) >= minimumVolume)
    : convertToSignals(binanceData, minimumVolume).filter(signal => (signal.volume || 0) >= minimumVolume);
  
  // Calculate stats based on signals
  const stats = useMockData ? generateMockStats() : calculateDashboardStats(signals);

  // Calculate projections
  const projections = generateProjections(projectionDays, stats);
  
  // Recent signals - use the first 5 signals or mock data if no signals
  const recent = signals.length > 0 ? signals.slice(0, 5) : recentSignals;
  
  // Use mock completed trades for the trade log
  const trades = useMockData ? completedTrades : [];
  
  // If error fetching Binance data, fall back to mock data
  useEffect(() => {
    if (isError) {
      setUseMockData(true);
    }
  }, [isError]);

  const handleSignalGenerated = (signal: any) => {
    // Handle new signal generation
    console.log('New signal generated:', signal);
    setSelectedSymbol(signal.symbol);
  };

  const handleTradeExecuted = (trade: any) => {
    // Handle trade execution
    console.log('Trade executed:', trade);
  };

  const handleLeverageChange = (leverage: number) => {
    setCurrentLeverage(leverage);
    console.log('Leverage changed to:', leverage);
  };

  return (
    <div className="min-h-screen bg-trading-bg">
      <Header />
      
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-6">Advanced Trading Dashboard</h1>
        
        <div className="space-y-6">
          {/* Status indicator for data source */}
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${useMockData ? 'bg-amber-500' : 'bg-green-500'}`}></div>
            <span className="text-sm text-muted-foreground">
              {useMockData ? 'Using mock data' : 'Connected to Binance API'}
              {isLoading && ' (refreshing...)'}
            </span>
          </div>
          
          {/* Total Balance */}
          <TotalBalance 
            balance={stats.totalBalance || 10000} 
            startingBalance={stats.startingBalance}
            performanceHistory={stats.performanceHistory}
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
              onClick={() => setActiveTab('trades')}
              className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'trades' ? 'bg-primary text-white' : 'bg-gray-800 text-muted-foreground hover:bg-gray-700'}`}
            >
              Open Trades
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
          </div>
          
          {/* Volume filter */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Minimum Volume: ${minimumVolume.toLocaleString()}</span>
            <input 
              type="range" 
              min="10000" 
              max="1000000" 
              step="10000"
              value={minimumVolume}
              onChange={(e) => setMinimumVolume(parseInt(e.target.value))}
              className="w-64"
            />
          </div>
          
          {/* Main content based on active tab */}
          <div>
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <SignalTable signals={signals} />
                  </div>
                  <div>
                    <RecentSignals signals={recent} />
                  </div>
                </div>
                <TradingViewChart symbol={selectedSymbol} />
              </div>
            )}
            
            {activeTab === 'trades' && (
              <div className="space-y-6">
                <OpenTrades trades={signals} />
                <TradingViewChart symbol={selectedSymbol} />
              </div>
            )}
            
            {activeTab === 'logs' && (
              <TradeLog trades={trades} />
            )}
            
            {activeTab === 'backtest' && (
              <BacktestResults />
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
                <SignalGenerator 
                  onSignalGenerated={handleSignalGenerated}
                  onTradeExecuted={handleTradeExecuted}
                />
                <LeverageControl 
                  currentLeverage={currentLeverage}
                  onLeverageChange={handleLeverageChange}
                />
              </div>
            )}
            
            {activeTab === 'ai' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AiLearningChart />
                <AiInsights />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
