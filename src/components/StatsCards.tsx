
import { Card, CardContent } from '@/components/ui/card';
import { DashboardStats } from '@/types';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface StatsCardsProps {
  stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  // Use real performance history data instead of mock data
  const chartData = stats.performanceHistory?.slice(-20).map(h => ({ value: h.balance })) || 
    [{ value: stats.totalBalance }];
  
  const winRateData = stats.performanceHistory?.slice(-20).map(h => ({ value: h.win_rate * 100 })) || 
    [{ value: stats.winRate * 100 }];
  
  const tradesData = stats.performanceHistory?.slice(-20).map(h => ({ value: h.trades_count })) || 
    [{ value: stats.executedTrades }];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard 
        title="Active Signals" 
        value={stats.activeSignals.toString()} 
        description="Live trading signals" 
        chart={chartData}
        trend={stats.activeSignals > 5 ? "up" : "down"}
      />
      <StatCard 
        title="Executed Trades" 
        value={stats.executedTrades.toString()} 
        description="Total completed trades" 
        chart={tradesData}
      />
      <StatCard 
        title="Win Rate" 
        value={`${(stats.winRate * 100).toFixed(1)}%`} 
        description="Overall success rate" 
        chart={winRateData}
        trend={stats.winRate > 0.6 ? "up" : "down"}
      />
      <StatCard 
        title="Capital at Risk" 
        value={`$${stats.capitalAtRisk.toLocaleString()}`} 
        description="Current exposure" 
        chart={chartData.slice(-10)} // Recent balance trend
        trend="neutral"
      />
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
