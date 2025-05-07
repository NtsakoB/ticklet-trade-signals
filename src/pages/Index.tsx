
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import StatsCards from "@/components/StatsCards";
import SignalTable from "@/components/SignalTable";
import RecentSignals from "@/components/RecentSignals";
import { mockSignals, recentSignals, generateMockStats } from "@/services/mockData";
import { fetchMultipleSymbols, convertToSignals, calculateDashboardStats } from "@/services/binanceApi";
import { DashboardStats, TradeSignal } from "@/types";

const Index = () => {
  // State for when we fall back to mock data
  const [useMockData, setUseMockData] = useState(false);

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
          
          {/* Stats Cards */}
          <StatsCards stats={stats} />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - Signal Table */}
            <div className="lg:col-span-2">
              <SignalTable signals={signals} />
            </div>
            
            {/* Sidebar - Recent Signals */}
            <div>
              <RecentSignals signals={recent} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
