
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, Target, DollarSign } from "lucide-react";

interface BacktestData {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  performanceData: Array<{
    date: string;
    equity: number;
    drawdown: number;
  }>;
  monthlyReturns: Array<{
    month: string;
    return: number;
  }>;
}

const BacktestResults = () => {
  // Mock backtest data - in real implementation, this would come from props or API
  const backtestData: BacktestData = {
    totalTrades: 245,
    winningTrades: 156,
    losingTrades: 89,
    winRate: 63.7,
    totalReturn: 187.5,
    maxDrawdown: -12.3,
    sharpeRatio: 1.85,
    profitFactor: 2.1,
    avgWin: 2.8,
    avgLoss: -1.5,
    performanceData: Array.from({ length: 365 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (365 - i));
      const growth = 1 + (i * 0.005) + (Math.random() * 0.02 - 0.01);
      return {
        date: date.toISOString().split('T')[0],
        equity: 10000 * growth,
        drawdown: Math.random() * -5
      };
    }),
    monthlyReturns: Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2024, i).toLocaleString('default', { month: 'short' }),
      return: (Math.random() * 20) - 5
    }))
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-trading-card border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-sm text-muted-foreground">Total Trades</p>
                <p className="text-xl font-bold">{backtestData.totalTrades}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-trading-card border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-sm text-muted-foreground">Win Rate</p>
                <p className="text-xl font-bold text-green-400">{backtestData.winRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-trading-card border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-sm text-muted-foreground">Total Return</p>
                <p className="text-xl font-bold text-green-400">+{backtestData.totalReturn}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-trading-card border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-400" />
              <div>
                <p className="text-sm text-muted-foreground">Max Drawdown</p>
                <p className="text-xl font-bold text-red-400">{backtestData.maxDrawdown}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-trading-card border-gray-800">
          <CardHeader>
            <CardTitle>Equity Curve</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={backtestData.performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis tickFormatter={(value) => `$${Math.round(value / 1000)}K`} />
                  <Tooltip 
                    formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Equity']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="equity" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-trading-card border-gray-800">
          <CardHeader>
            <CardTitle>Monthly Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={backtestData.monthlyReturns}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `${value}%`} />
                  <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Return']} />
                  <Bar 
                    dataKey="return" 
                    fill={(entry: any) => entry.return > 0 ? "#10b981" : "#ef4444"}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Card className="bg-trading-card border-gray-800">
        <CardHeader>
          <CardTitle>Detailed Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Winning Trades</p>
              <p className="text-lg font-semibold text-green-400">{backtestData.winningTrades}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Losing Trades</p>
              <p className="text-lg font-semibold text-red-400">{backtestData.losingTrades}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Profit Factor</p>
              <p className="text-lg font-semibold">{backtestData.profitFactor}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
              <p className="text-lg font-semibold">{backtestData.sharpeRatio}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Win</p>
              <p className="text-lg font-semibold text-green-400">+{backtestData.avgWin}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Loss</p>
              <p className="text-lg font-semibold text-red-400">{backtestData.avgLoss}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BacktestResults;
