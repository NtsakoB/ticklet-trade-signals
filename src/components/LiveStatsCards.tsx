import { Card, CardContent } from '@/components/ui/card';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { SignalsService } from '@/services/signalsService';

export function LiveStatsCards({ refreshInterval = 30000 }: { refreshInterval?: number }) {
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const { data: stats, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => SignalsService.getDashboardStats(),
    refetchInterval: refreshInterval,
    retry: 2,
    retryDelay: 1000,
  });

  useEffect(() => {
    if (stats?.last_updated) {
      try {
        setLastUpdate(new Date(stats.last_updated).toLocaleTimeString());
      } catch {}
    }
  }, [stats?.last_updated]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <Card key={i} className="bg-trading-card border-gray-800 animate-pulse">
            <CardContent className="pt-6">
              <div className="h-20 bg-gray-700 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-red-900/20 border-red-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-400 text-sm mb-2">API Error</p>
              <button onClick={() => refetch()} className="text-xs bg-red-800 px-2 py-1 rounded hover:bg-red-700">
                Retry
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const winRatePct = (stats.win_rate * 100).toFixed(1);
  
  // Guard against undefined arrays to prevent crashes
  const safePerformanceHistory = Array.isArray(stats.performance_history) ? stats.performance_history : [];
  const safeActiveSignals = typeof stats.active_signals === 'number' ? stats.active_signals : 0;
  const safeExecutedTrades = typeof stats.executed_trades === 'number' ? stats.executed_trades : 0;
  const safeWinRate = typeof stats.win_rate === 'number' ? stats.win_rate : 0;
  const safeCapitalAtRisk = typeof stats.capital_at_risk === 'number' ? stats.capital_at_risk : 0;
  const safeTotalBalance = typeof stats.total_balance === 'number' ? stats.total_balance : 0;
  const safeStartingBalance = typeof stats.starting_balance === 'number' ? stats.starting_balance : 10000;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>Live Data • Last updated: {lastUpdate}</span>
        </div>
        <button onClick={() => refetch()} className="hover:text-white transition-colors">🔄 Refresh</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Signals" value={String(safeActiveSignals)} description="Live trading signals"
          chart={safePerformanceHistory.slice(-10).map(p => ({ value: p?.trades_count || 0 }))}
          trend={safeActiveSignals > 5 ? "up" : safeActiveSignals > 0 ? "neutral" : "down"} isLive />
        <StatCard title="Executed Trades" value={String(safeExecutedTrades)} description="Total completed trades"
          chart={safePerformanceHistory.slice(-10).map(p => ({ value: p?.trades_count || 0 }))} trend="neutral" />
        <StatCard title="Win Rate" value={`${winRatePct}%`} description="Overall success rate"
          chart={safePerformanceHistory.slice(-10).map(p => ({ value: (p?.win_rate || 0) * 100 }))}
          trend={safeWinRate > 0.6 ? "up" : safeWinRate > 0.4 ? "neutral" : "down"} />
        <StatCard title="Capital at Risk" value={`$${safeCapitalAtRisk.toLocaleString()}`} description="Current exposure"
          chart={safePerformanceHistory.slice(-10).map(p => ({ value: (p?.balance || 0) / 100 }))}
          trend={safeCapitalAtRisk > safeTotalBalance * 0.5 ? "down" : "neutral"} />
      </div>

      <Card className="bg-trading-card border-gray-800">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Total Balance</p>
              <h3 className="text-3xl font-bold text-white">${safeTotalBalance.toLocaleString()}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {safeTotalBalance > safeStartingBalance ? '+' : ''}
                ${(safeTotalBalance - safeStartingBalance).toLocaleString()} (
                {((safeTotalBalance - safeStartingBalance) / (safeStartingBalance || 1) * 100).toFixed(1)}%)
              </p>
            </div>
            <div className="h-16 w-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={safePerformanceHistory.slice(-20)}>
                  <Line type="monotone" dataKey="balance" stroke={safeTotalBalance > safeStartingBalance ? "#10b981" : "#ef4444"} strokeWidth={2} dot={false}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, description, chart, trend = "neutral", isLive = false }:{
  title: string; value: string; description: string; chart: { value: number }[];
  trend?: "up"|"down"|"neutral"; isLive?: boolean;
}) {
  const strokeColor = trend === "up" ? "#10b981" : trend === "down" ? "#ef4444" : "#3b82f6";
  const trendColor = trend === "up" ? "text-trading-positive" : trend === "down" ? "text-trading-negative" : "text-trading-neutral";
  const safeChart = Array.isArray(chart) ? chart : [];
  
  return (
    <Card className="bg-trading-card border-gray-800 relative">
      {isLive && <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
      <CardContent className="pt-6">
        <div className="flex justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <h3 className={`text-2xl font-bold mt-1 ${trendColor}`}>{value}</h3>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <div className="h-12 w-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={safeChart}>
                <Line type="monotone" dataKey="value" stroke={strokeColor} strokeWidth={2} dot={false}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}