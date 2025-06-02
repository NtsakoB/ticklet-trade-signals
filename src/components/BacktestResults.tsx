
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Target, Calendar, BarChart3 } from "lucide-react";

const BacktestResults = () => {
  // Mock backtest data - in a real implementation, this would come from your backtesting engine
  const backtestData = {
    period: "3 Years (2021-2024)",
    totalTrades: 147,
    winningTrades: 89,
    losingTrades: 58,
    winRate: 60.5,
    totalReturn: 234.7,
    maxDrawdown: 12.3,
    sharpeRatio: 1.42,
    avgWinAmount: 156.8,
    avgLossAmount: -89.2,
    bestTrade: 542.1,
    worstTrade: -234.5,
    profitFactor: 1.76
  };

  const monthlyReturns = [
    { month: 'Jan 2024', return: 12.5, trades: 8 },
    { month: 'Feb 2024', return: -3.2, trades: 12 },
    { month: 'Mar 2024', return: 18.7, trades: 15 },
    { month: 'Apr 2024', return: 5.4, trades: 9 },
    { month: 'May 2024', return: -8.1, trades: 11 },
    { month: 'Jun 2024', return: 22.3, trades: 14 }
  ];

  const pieData = [
    { name: 'Winning Trades', value: backtestData.winningTrades, color: '#10b981' },
    { name: 'Losing Trades', value: backtestData.losingTrades, color: '#ef4444' }
  ];

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  return (
    <div className="space-y-6">
      <Card className="bg-trading-card border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Backtest Results - {backtestData.period}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{backtestData.totalTrades}</div>
              <div className="text-sm text-muted-foreground">Total Trades</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{formatPercentage(backtestData.winRate)}</div>
              <div className="text-sm text-muted-foreground">Win Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{formatPercentage(backtestData.totalReturn)}</div>
              <div className="text-sm text-muted-foreground">Total Return</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">{backtestData.sharpeRatio}</div>
              <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Win/Loss Distribution */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Trade Distribution</h4>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Trades']} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly Returns */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Monthly Returns (2024)</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyReturns}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#9CA3AF" 
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: '#F9FAFB' 
                    }}
                    formatter={(value) => [`${value}%`, 'Return']}
                  />
                  <Bar 
                    dataKey="return" 
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Statistics */}
      <Card className="bg-trading-card border-gray-800">
        <CardHeader>
          <CardTitle>Detailed Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-green-400">Profitability</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Win:</span>
                  <span className="text-green-400">{formatCurrency(backtestData.avgWinAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Loss:</span>
                  <span className="text-red-400">{formatCurrency(backtestData.avgLossAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Best Trade:</span>
                  <span className="text-green-400">{formatCurrency(backtestData.bestTrade)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Worst Trade:</span>
                  <span className="text-red-400">{formatCurrency(backtestData.worstTrade)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-blue-400">Risk Metrics</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Drawdown:</span>
                  <span className="text-orange-400">{formatPercentage(backtestData.maxDrawdown)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Profit Factor:</span>
                  <span className="text-blue-400">{backtestData.profitFactor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sharpe Ratio:</span>
                  <span className="text-blue-400">{backtestData.sharpeRatio}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-purple-400">Strategy Summary</h4>
              <div className="space-y-2">
                <Badge variant="outline" className="text-green-400 border-green-400/20">
                  Profitable Strategy
                </Badge>
                <Badge variant="outline" className="text-blue-400 border-blue-400/20">
                  Good Risk-Adjusted Returns
                </Badge>
                <Badge variant="outline" className="text-purple-400 border-purple-400/20">
                  Consistent Performance
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                The strategy shows consistent profitability over the 3-year backtest period with 
                a solid win rate of {formatPercentage(backtestData.winRate)} and strong risk-adjusted returns.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BacktestResults;
