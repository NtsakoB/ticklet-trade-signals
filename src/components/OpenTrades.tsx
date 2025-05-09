
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TradeSignal } from "@/types";
import { toast } from "sonner";
import { formatDistanceToNow, formatDistance } from 'date-fns';
import { Eye, CircleMinus, Clock } from "lucide-react";

interface OpenTradesProps {
  trades: TradeSignal[];
}

const OpenTrades = ({ trades }: OpenTradesProps) => {
  // Only show active trades
  const openTrades = trades.filter(trade => trade.status === "active");
  
  const handleCloseManually = (trade: TradeSignal) => {
    const currentPrice = trade.entryPrice * (trade.type === "BUY" ? 1.05 : 0.95); // Just for demo
    const pnl = trade.type === "BUY" 
      ? (currentPrice - trade.entryPrice) 
      : (trade.entryPrice - currentPrice);
      
    toast.success(`${trade.symbol} trade closed manually`, {
      description: `PnL: ${pnl > 0 ? '+' : ''}${pnl.toFixed(2)} USD`
    });
  };
  
  // Calculate duration for each trade
  const tradesWithDuration = openTrades.map(trade => {
    const start = new Date(trade.timestamp);
    const now = new Date();
    const durationMs = now.getTime() - start.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const duration = `${hours}h ${minutes}m`;
    
    return {
      ...trade,
      duration
    };
  });
  
  return (
    <Card className="bg-trading-card border-gray-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Open Trades</CardTitle>
          </div>
          <Badge variant="outline" className="text-sm">
            {openTrades.length} Active
          </Badge>
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
                  <TableHead>Current Price</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Leverage</TableHead>
                  <TableHead>Exposure</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tradesWithDuration.length > 0 ? (
                  tradesWithDuration.map((trade) => {
                    // Mock current price for demo purposes
                    const currentPrice = trade.entryPrice * (trade.type === "BUY" ? 1.05 : 0.95);
                    const priceChange = trade.type === "BUY" 
                      ? (currentPrice - trade.entryPrice) / trade.entryPrice * 100
                      : (trade.entryPrice - currentPrice) / trade.entryPrice * 100;
                    
                    // Calculate progress towards targets
                    const target = trade.targets[0];
                    const progressPercent = Math.min(
                      Math.abs((currentPrice - trade.entryPrice) / (target - trade.entryPrice) * 100),
                      100
                    );
                    
                    return (
                      <TableRow key={`${trade.id}-open`} className="hover:bg-gray-800">
                        <TableCell className="font-medium">{trade.symbol}</TableCell>
                        <TableCell>
                          <Badge variant={trade.type === "BUY" ? "success" : "destructive"}>
                            {trade.type}
                          </Badge>
                        </TableCell>
                        <TableCell>${trade.entryPrice.toFixed(2)}</TableCell>
                        <TableCell className={priceChange > 0 ? "text-trading-positive" : "text-trading-negative"}>
                          ${currentPrice.toFixed(2)} ({priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)}%)
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs">{trade.duration}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {trade.leverage || 1}x
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>${trade.exposure?.toFixed(2)}</span>
                            <span className="text-xs text-muted-foreground">
                              ({trade.exposurePercentage?.toFixed(1)}%)
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="w-full bg-gray-700 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full ${priceChange > 0 ? "bg-trading-positive" : "bg-trading-negative"}`}
                              style={{ width: `${progressPercent}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between mt-1 text-xs">
                            <span>{progressPercent.toFixed(0)}%</span>
                            <span>Target: ${target}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleCloseManually(trade)}
                            className="text-trading-negative hover:text-white hover:bg-trading-negative"
                          >
                            <CircleMinus className="h-4 w-4 mr-1" />
                            <span className="text-xs">Close</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      No open trades.
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

export default OpenTrades;
