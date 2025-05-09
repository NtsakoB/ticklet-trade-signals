
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
import { mockSignals, recentSignals, generateMockStats, completedTrades } from "@/services/mockData";
import { fetchMultipleSymbols, convertToSignals, calculateDashboardStats } from "@/services/binanceApi";
import { DashboardStats, TradeSignal } from "@/types";

const Index = () => {
  // State for when we fall back to mock data
  const [useMockData, setUseMockData] = useState(false);
  const [activeTab, setActiveTab] = useState<'signals' | 'trades' | 'log' | 'ai'>('signals');

  // Fetch real data from Binance
  const { data: binanceData, isLoading, isError } = useQuery({
    queryKey: ['binanceData'],
    queryFn: () => fetchMultipleSymbols(),
    refetchInterval: 60000, // Refresh every minute
    retry: 2
  });

  // Convert Binance data to signals
  const signals = useMockData ? mockSignals : (binanceData ? convertToSignals(binanceData) : []);
  
  // Calculate stats based on signals
  const stats = useMockData ? generateMockStats() : calculateDashboardStats(signals);

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

  return (
    <div className="min-h-screen bg-trading-bg">
      <Header />
      
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        
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
          <TotalBalance balance={stats.totalBalance || 10000} />
          
          {/* Stats Cards */}
          <StatsCards stats={stats} />
          
          {/* Tab buttons */}
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setActiveTab('signals')}
              className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'signals' ? 'bg-primary text-white' : 'bg-gray-800 text-muted-foreground hover:bg-gray-700'}`}
            >
              Trade Signals
            </button>
            <button 
              onClick={() => setActiveTab('trades')}
              className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'trades' ? 'bg-primary text-white' : 'bg-gray-800 text-muted-foreground hover:bg-gray-700'}`}
            >
              Open Trades
            </button>
            <button 
              onClick={() => setActiveTab('log')}
              className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'log' ? 'bg-primary text-white' : 'bg-gray-800 text-muted-foreground hover:bg-gray-700'}`}
            >
              Trade Log
            </button>
            <button 
              onClick={() => setActiveTab('ai')}
              className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'ai' ? 'bg-primary text-white' : 'bg-gray-800 text-muted-foreground hover:bg-gray-700'}`}
            >
              AI Analytics
            </button>
          </div>
          
          {/* Main content based on active tab */}
          <div>
            {activeTab === 'signals' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <SignalTable signals={signals} />
                </div>
                <div>
                  <RecentSignals signals={recent} />
                </div>
              </div>
            )}
            
            {activeTab === 'trades' && (
              <OpenTrades trades={signals} />
            )}
            
            {activeTab === 'log' && (
              <TradeLog trades={trades} />
            )}
            
            {activeTab === 'ai' && (
              <AiLearningChart />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
