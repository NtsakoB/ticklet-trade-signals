
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TradeSignal } from "@/types";
import { formatDistanceToNow } from 'date-fns';
import { Book, TrendingDown, TrendingUp } from "lucide-react";

interface Trade extends TradeSignal {
  pnl?: number;
  exitPrice?: number;
  exitTime?: string;
  profitPercentage?: number;
}

interface TradeLogProps {
  trades: Trade[];
}

const TradeLog = ({ trades }: TradeLogProps) => {
  const [filter, setFilter] = useState<'all' | 'profit' | 'loss'>('all');
  
  const filteredTrades = trades.filter(trade => {
    if (filter === 'all') return true;
    if (filter === 'profit' && (trade.pnl || 0) > 0) return true;
    if (filter === 'loss' && (trade.pnl || 0) < 0) return true;
    return false;
  });
  
  // Calculate total PnL
  const totalPnl = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);

  return (
    <Card className="bg-trading-card border-gray-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Book className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Trade Log</CardTitle>
          </div>
          <div className="flex gap-2">
            <Badge 
              variant={filter === 'all' ? 'default' : 'outline'} 
              className="cursor-pointer" 
              onClick={() => setFilter('all')}
            >
              All
            </Badge>
            <Badge 
              variant={filter === 'profit' ? 'success' : 'outline'} 
              className="cursor-pointer" 
              onClick={() => setFilter('profit')}
            >
              Profit
            </Badge>
            <Badge 
              variant={filter === 'loss' ? 'destructive' : 'outline'} 
              className="cursor-pointer" 
              onClick={() => setFilter('loss')}
            >
              Loss
            </Badge>
          </div>
        </div>
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
                  <TableHead>Exit Price</TableHead>
                  <TableHead>PnL</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrades.length > 0 ? (
                  filteredTrades.map((trade) => (
                    <TableRow key={`${trade.id}-log`} className="hover:bg-gray-800">
                      <TableCell className="font-medium">{trade.symbol}</TableCell>
                      <TableCell>
                        <Badge variant={trade.type === "BUY" ? "success" : "destructive"}>
                          {trade.type}
                        </Badge>
                      </TableCell>
                      <TableCell>${trade.entryPrice}</TableCell>
                      <TableCell>${trade.exitPrice || '—'}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {trade.pnl !== undefined && (
                            <>
                              {trade.pnl > 0 ? (
                                <TrendingUp className="h-4 w-4 text-trading-positive mr-1" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-trading-negative mr-1" />
                              )}
                              <span className={trade.pnl > 0 ? "text-trading-positive" : "text-trading-negative"}>
                                ${Math.abs(trade.pnl).toFixed(2)} ({trade.profitPercentage && `${trade.profitPercentage > 0 ? '+' : ''}${trade.profitPercentage.toFixed(2)}%`})
                              </span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {trade.source === "strategy" ? (
                          <Badge variant="secondary">Strategy</Badge>
                        ) : trade.source === "telegram" ? (
                          <Badge variant="outline" className="text-blue-400 border-blue-400/20">
                            Telegram
                          </Badge>
                        ) : (
                          <Badge variant="outline">Unknown</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {trade.exitTime 
                          ? formatDistanceToNow(new Date(trade.exitTime), { addSuffix: true })
                          : formatDistanceToNow(new Date(trade.timestamp), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No trades found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TradeLog;
