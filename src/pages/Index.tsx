
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import StatsCards from "@/components/StatsCards";
import SignalTable from "@/components/SignalTable";
import RecentSignals from "@/components/RecentSignals";
import { mockSignals, recentSignals, generateMockStats } from "@/services/mockData";
import { DashboardStats } from "@/types";

const Index = () => {
  const [stats, setStats] = useState<DashboardStats>({
    activeSignals: 0,
    executedTrades: 0,
    winRate: 0,
    capitalAtRisk: 0
  });

  // Simulate loading data
  useEffect(() => {
    const timer = setTimeout(() => {
      setStats(generateMockStats());
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-trading-bg">
      <Header />
      
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        
        <div className="space-y-6">
          {/* Stats Cards */}
          <StatsCards stats={stats} />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - Signal Table */}
            <div className="lg:col-span-2">
              <SignalTable signals={mockSignals} />
            </div>
            
            {/* Sidebar - Recent Signals */}
            <div>
              <RecentSignals signals={recentSignals} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
