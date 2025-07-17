import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { Book, TrendingDown, TrendingUp, Clock } from "lucide-react";

interface SimpleTrade {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  pnl: number;
  timestamp: string;
  status: 'completed';
}

interface TradeLogProps {
  trades: SimpleTrade[];
}

const TradeLog = ({ trades }: TradeLogProps) => {
  const [filter, setFilter] = useState<'all' | 'profit' | 'loss'>('all');
  
  const filteredTrades = trades.filter(trade => {
    if (filter === 'all') return true;
    if (filter === 'profit' && trade.pnl > 0) return true;
    if (filter === 'loss' && trade.pnl < 0) return true;
    return false;
  });
  
  // Calculate total PnL
  const totalPnl = trades.reduce((sum, trade) => sum + trade.pnl, 0);

  return (
    <Card className="bg-trading-card border-gray-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Book className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Trade Log</CardTitle>
            <Badge variant="outline" className="ml-2">
              Total PnL: ${totalPnl.toFixed(2)}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Badge 
              variant={filter === 'all' ? 'default' : 'outline'} 
              className="cursor-pointer" 
              onClick={() => setFilter('all')}
            >
              All ({trades.length})
            </Badge>
            <Badge 
              variant={filter === 'profit' ? 'default' : 'outline'} 
              className="cursor-pointer text-green-400" 
              onClick={() => setFilter('profit')}
            >
              Profit ({trades.filter(t => t.pnl > 0).length})
            </Badge>
            <Badge 
              variant={filter === 'loss' ? 'destructive' : 'outline'} 
              className="cursor-pointer" 
              onClick={() => setFilter('loss')}
            >
              Loss ({trades.filter(t => t.pnl < 0).length})
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
            <TableHead>Side</TableHead>
            <TableHead>Strategy</TableHead>
            <TableHead>PnL</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrades.length > 0 ? (
                  filteredTrades.map((trade) => (
                    <TableRow key={trade.id} className="hover:bg-gray-800">
                      <TableCell className="font-medium">{trade.symbol}</TableCell>
                      <TableCell>
                        <Badge variant={trade.side === 'BUY' ? 'default' : 'destructive'}>
                          {trade.side}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={trade.pnl > 0 ? 'default' : 'destructive'}>
                          {trade.pnl > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                          ${Math.abs(trade.pnl).toFixed(2)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(trade.timestamp), 'HH:mm')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{trade.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
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