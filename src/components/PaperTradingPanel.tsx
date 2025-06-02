
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, DollarSign, Play, Square } from "lucide-react";
import PaperTradingService from "@/services/paperTradingService";
import { toast } from "sonner";

const PaperTradingPanel = () => {
  const [stats, setStats] = useState<any>({});
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const loadStats = () => {
      const paperStats = PaperTradingService.getPaperTradingStats();
      setStats(paperStats);
    };
    
    loadStats();
  }, [refreshKey]);

  const handleCloseTrade = async (tradeId: string) => {
    try {
      await PaperTradingService.closePaperTrade(tradeId);
      toast.success("Paper trade closed successfully");
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      toast.error("Failed to close paper trade");
      console.error(error);
    }
  };

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  return (
    <div className="space-y-6">
      {/* Paper Trading Overview */}
      <Card className="bg-trading-card border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Paper Trading Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {formatCurrency(stats.balance || 0)}
              </div>
              <div className="text-sm text-muted-foreground">Current Balance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {stats.totalTrades || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Trades</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">
                {stats.openTrades || 0}
              </div>
              <div className="text-sm text-muted-foreground">Open Trades</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {formatPercentage(stats.winRate || 0)}
              </div>
              <div className="text-sm text-muted-foreground">Win Rate</div>
            </div>
          </div>

          {stats.totalPnL !== undefined && (
            <div className="mt-4 p-4 rounded-lg bg-gray-800/50">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total P&L:</span>
                <span className={`font-bold ${stats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stats.totalPnL >= 0 ? '+' : ''}{formatCurrency(stats.totalPnL)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paper Trades Table */}
      <Card className="bg-trading-card border-gray-800">
        <CardHeader>
          <CardTitle>Paper Trades</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md border border-gray-800">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-gray-800">
                    <TableHead>Symbol</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Entry Price</TableHead>
                    <TableHead>Current/Exit Price</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Leverage</TableHead>
                    <TableHead>P&L</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.paperTrades && stats.paperTrades.length > 0 ? (
                    stats.paperTrades.map((trade: any) => (
                      <TableRow key={trade.id} className="hover:bg-gray-800">
                        <TableCell className="font-medium">{trade.symbol}</TableCell>
                        <TableCell>
                          <Badge variant={trade.type === "BUY" ? "default" : "destructive"}>
                            {trade.type}
                          </Badge>
                        </TableCell>
                        <TableCell>${trade.entryPrice.toFixed(4)}</TableCell>
                        <TableCell>
                          {trade.exitPrice ? `$${trade.exitPrice.toFixed(4)}` : 'Live Price'}
                        </TableCell>
                        <TableCell>{trade.quantity.toFixed(6)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{trade.leverage}x</Badge>
                        </TableCell>
                        <TableCell>
                          {trade.pnl !== undefined ? (
                            <div className="flex items-center">
                              {trade.pnl > 0 ? (
                                <TrendingUp className="h-4 w-4 text-green-400 mr-1" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-400 mr-1" />
                              )}
                              <span className={trade.pnl > 0 ? "text-green-400" : "text-red-400"}>
                                {formatCurrency(Math.abs(trade.pnl))}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Pending</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={trade.status === 'open' ? 'default' : 'secondary'}>
                            {trade.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {trade.status === 'open' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCloseTrade(trade.id)}
                            >
                              <Square className="h-3 w-3 mr-1" />
                              Close
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center">
                        No paper trades found. Execute some signals to see trades here.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaperTradingPanel;
