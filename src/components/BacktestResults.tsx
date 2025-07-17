
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { BarChart3, Play, Loader2 } from "lucide-react";
import BacktestService from "@/services/backtestService";
import StorageService, { BacktestResult } from "@/services/storageService";
import { toast } from "sonner";

const BacktestResults = () => {
  const [backtestResults, setBacktestResults] = useState<BacktestResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<BacktestResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [monthlyReturns, setMonthlyReturns] = useState<any[]>([]);
  
  // Backtest parameters
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [startDate, setStartDate] = useState("2020-01-01"); // Fixed 5-year period
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]); // Current date
  const [initialBalance, setInitialBalance] = useState(10000);
  const [strategyType, setStrategyType] = useState("ticklet-alpha");
  const [timeframe, setTimeframe] = useState("1h");

  useEffect(() => {
    loadBacktestResults();
    loadMonthlyReturns();
  }, []);

  const loadBacktestResults = () => {
    const results = StorageService.getBacktestResults();
    setBacktestResults(results);
    if (results.length > 0 && !selectedResult) {
      setSelectedResult(results[results.length - 1]); // Show latest result
    }
  };

  const loadMonthlyReturns = async () => {
    try {
      const returns = await BacktestService.getMonthlyReturns(2021, 2024);
      setMonthlyReturns(returns);
    } catch (error) {
      console.error('Failed to load monthly returns:', error);
    }
  };

  const runBacktest = async () => {
    setIsRunning(true);
    try {
      const result = await BacktestService.runBacktest(
        symbol,
        new Date(startDate),
        new Date(endDate),
        initialBalance,
        strategyType,
        timeframe
      );
      
      toast.success(`${strategyType} backtest completed! ${result.trades.length} trades, ${result.winRate.toFixed(1)}% win rate`);
      loadBacktestResults();
      setSelectedResult(result);
      loadMonthlyReturns(); // Refresh monthly returns
      
    } catch (error: any) {
      toast.error(`Backtest failed: ${error.message}`);
      console.error('Backtest error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const pieData = selectedResult ? [
    { 
      name: 'Winning Trades', 
      value: selectedResult.trades.filter(t => (t.pnl || 0) > 0).length, 
      color: '#10b981' 
    },
    { 
      name: 'Losing Trades', 
      value: selectedResult.trades.filter(t => (t.pnl || 0) <= 0).length, 
      color: '#ef4444' 
    }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Backtest Controls */}
      <Card className="bg-trading-card border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Run New Backtest
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
            <div>
              <Label htmlFor="strategy">Strategy</Label>
              <Select value={strategyType} onValueChange={setStrategyType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ticklet-alpha">Ticklet ALPHA</SelectItem>
                  <SelectItem value="bull-strategy">Bull Strategy</SelectItem>
                  <SelectItem value="jam-bot">Jam Bot</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="timeframe">Timeframe</Label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15m">15 minutes</SelectItem>
                  <SelectItem value="1h">1 hour</SelectItem>
                  <SelectItem value="4h">4 hours</SelectItem>
                  <SelectItem value="1d">1 day</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="symbol">Symbol</Label>
              <Select value={symbol} onValueChange={setSymbol}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BTCUSDT">BTC/USDT</SelectItem>
                  <SelectItem value="ETHUSDT">ETH/USDT</SelectItem>
                  <SelectItem value="XRPUSDT">XRP/USDT</SelectItem>
                  <SelectItem value="SOLUSDT">SOL/USDT</SelectItem>
                  <SelectItem value="BNBUSDT">BNB/USDT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="startDate">Start (Fixed)</Label>
              <Input
                type="date"
                value={startDate}
                readOnly
                className="bg-gray-700 cursor-not-allowed"
              />
            </div>
            <div>
              <Label htmlFor="endDate">End (Current)</Label>
              <Input
                type="date"
                value={endDate}
                readOnly
                className="bg-gray-700 cursor-not-allowed"
              />
            </div>
            <div>
              <Label htmlFor="initialBalance">Initial Balance ($)</Label>
              <Input
                type="number"
                value={initialBalance}
                onChange={(e) => setInitialBalance(Number(e.target.value))}
              />
            </div>
          </div>
          
          <Button 
            onClick={runBacktest} 
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running Backtest...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Backtest
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Backtest Results Selection */}
      {backtestResults.length > 0 && (
        <Card className="bg-trading-card border-gray-800">
          <CardHeader>
            <CardTitle>Select Backtest Result</CardTitle>
          </CardHeader>
          <CardContent>
            <Select 
              value={selectedResult?.id || ""} 
              onValueChange={(value) => {
                const result = backtestResults.find(r => r.id === value);
                setSelectedResult(result || null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a backtest result" />
              </SelectTrigger>
              <SelectContent>
                {backtestResults.map((result) => (
                  <SelectItem key={result.id} value={result.id}>
                    {result.strategy} - {result.period} ({formatPercentage(result.totalReturn)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {selectedResult && (
        <Card className="bg-trading-card border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Backtest Results - {selectedResult.period}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{selectedResult.trades.length}</div>
                <div className="text-sm text-muted-foreground">Total Trades</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{formatPercentage(selectedResult.winRate)}</div>
                <div className="text-sm text-muted-foreground">Win Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{formatPercentage(selectedResult.totalReturn)}</div>
                <div className="text-sm text-muted-foreground">Total Return</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-400">{selectedResult.sharpeRatio.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
              </div>
            </div>

            {/* Balance Information */}
            <div className="grid grid-cols-2 gap-4 mb-6 p-4 rounded-lg bg-gray-800/50">
              <div>
                <p className="text-sm text-muted-foreground">Initial Balance</p>
                <p className="text-xl font-bold">{formatCurrency(selectedResult.initialBalance)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Final Balance</p>
                <p className="text-xl font-bold text-green-400">{formatCurrency(selectedResult.finalBalance)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Win/Loss Distribution */}
              {pieData.length > 0 && (
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
              )}

              {/* Monthly Returns */}
              {monthlyReturns.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold mb-4">Monthly Returns (2021-2024)</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={monthlyReturns}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="month" 
                        stroke="#9CA3AF" 
                        fontSize={10}
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
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Performance Metrics */}
      {selectedResult && (
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
                    <span className="text-muted-foreground">Total P&L:</span>
                    <span className={selectedResult.finalBalance > selectedResult.initialBalance ? "text-green-400" : "text-red-400"}>
                      {formatCurrency(selectedResult.finalBalance - selectedResult.initialBalance)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Win Rate:</span>
                    <span className="text-blue-400">{formatPercentage(selectedResult.winRate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Return:</span>
                    <span className="text-green-400">{formatPercentage(selectedResult.totalReturn)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-blue-400">Risk Metrics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Drawdown:</span>
                    <span className="text-orange-400">{formatPercentage(selectedResult.maxDrawdown)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sharpe Ratio:</span>
                    <span className="text-blue-400">{selectedResult.sharpeRatio.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Trades:</span>
                    <span className="text-blue-400">{selectedResult.trades.length}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-purple-400">Strategy Summary</h4>
                <div className="space-y-2">
                  <Badge variant="outline" className={`${selectedResult.totalReturn > 0 ? 'text-green-400 border-green-400/20' : 'text-red-400 border-red-400/20'}`}>
                    {selectedResult.totalReturn > 0 ? 'Profitable' : 'Losing'} Strategy
                  </Badge>
                  <Badge variant="outline" className="text-blue-400 border-blue-400/20">
                    {selectedResult.winRate > 50 ? 'Good' : 'Poor'} Win Rate
                  </Badge>
                  <Badge variant="outline" className="text-purple-400 border-purple-400/20">
                    Real Historical Data
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  The strategy achieved a {formatPercentage(selectedResult.totalReturn)} return 
                  with a {formatPercentage(selectedResult.winRate)} win rate over {selectedResult.trades.length} trades 
                  using real historical data from Binance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BacktestResults;
