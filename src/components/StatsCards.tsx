
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DashboardStats } from '@/types';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { fetchDashboardSummary, DashboardSummaryData } from '@/services/dashboardApi';

interface StatsCardsProps {
  stats?: DashboardStats; // Keep for backward compatibility
}

const generateMockChartData = () => Array.from({ length: 20 }, () => ({ value: Math.floor(Math.random() * 100) }));

export function StatsCards({ stats: legacyStats }: StatsCardsProps) {
  const [dashboardData, setDashboardData] = useState<DashboardSummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const data = await fetchDashboardSummary();
        setDashboardData(data);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Use real dashboard data if available, otherwise fall back to legacy stats
  const activeSignals = dashboardData?.active_signals ?? legacyStats?.activeSignals ?? 0;
  const executedTrades = dashboardData?.executed_trades ?? legacyStats?.executedTrades ?? 0;
  const winRate = dashboardData?.win_rate ?? legacyStats?.winRate ?? 0;
  const capitalAtRisk = dashboardData?.capital_at_risk ?? legacyStats?.capitalAtRisk ?? 0;

  const dataSource = dashboardData?.data_source ?? 'legacy';
  const chartData = generateMockChartData(); // Still using mock charts for now

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-trading-card border-gray-800 animate-pulse">
            <CardContent className="pt-6">
              <div className="h-16 bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Data source indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className={`w-2 h-2 rounded-full ${
          dataSource === 'supabase' ? 'bg-green-500' : 
          dataSource === 'csv_fallback' ? 'bg-yellow-500' : 'bg-red-500'
        }`}></div>
        <span>
          Data source: {
            dataSource === 'supabase' ? 'Supabase (live)' :
            dataSource === 'csv_fallback' ? 'CSV fallback' :
            dataSource === 'legacy' ? 'Legacy mock data' : 'Mock data'
          }
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Active Signals" 
          value={activeSignals.toString()} 
          description="Live trading signals" 
          chart={chartData}
          trend={activeSignals > 5 ? "up" : "down"}
        />
        <StatCard 
          title="Executed Trades" 
          value={executedTrades.toString()} 
          description="Total completed trades" 
          chart={chartData.slice(5)}
        />
        <StatCard 
          title="Win Rate" 
          value={`${(winRate * 100).toFixed(1)}%`} 
          description="Overall success rate" 
          chart={chartData.slice(10)}
          trend={winRate > 0.6 ? "up" : "down"}
        />
        <StatCard 
          title="Capital at Risk" 
          value={`$${capitalAtRisk.toLocaleString()}`} 
          description="Current exposure" 
          chart={chartData.slice(2)}
          trend="neutral"
        />
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  chart: { value: number }[];
  trend?: "up" | "down" | "neutral";
}

function StatCard({ title, value, description, chart, trend = "neutral" }: StatCardProps) {
  const trendColor = trend === "up" 
    ? "text-trading-positive" 
    : trend === "down" 
      ? "text-trading-negative" 
      : "text-trading-neutral";
  
  return (
    <Card className="bg-trading-card border-gray-800">
      <CardContent className="pt-6">
        <div className="flex justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <h3 className={`text-2xl font-bold mt-1 ${trendColor}`}>{value}</h3>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <div className="h-12 w-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chart}>
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={trend === "up" ? "#10b981" : trend === "down" ? "#ef4444" : "#3b82f6"} 
                  strokeWidth={2} 
                  dot={false} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default StatsCards;
