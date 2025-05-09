
import { useState } from "react";
import { TradeSignal, SignalFilter } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckIcon, Cross2Icon } from '@radix-ui/react-icons';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Flag } from "lucide-react";

interface SignalTableProps {
  signals: TradeSignal[];
}

export function SignalTable({ signals }: SignalTableProps) {
  const [filter, setFilter] = useState<SignalFilter>({});
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSignals = signals.filter(signal => {
    // Apply search term
    if (searchTerm && !signal.symbol.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Apply filters
    if (filter.types && !filter.types.includes(signal.type)) {
      return false;
    }
    
    if (filter.status && !filter.status.includes(signal.status)) {
      return false;
    }
    
    return true;
  });
  
  const handleExecute = (signal: TradeSignal) => {
    toast.success(`Signal executed: ${signal.symbol} ${signal.type} at ${signal.entryPrice}`, {
      description: "Trade order has been sent to exchange"
    });
  };
  
  const handleCancel = (signal: TradeSignal) => {
    toast.info(`Signal cancelled: ${signal.symbol}`, {
      description: "Signal has been removed from active list"
    });
  };

  return (
    <Card className="bg-trading-card border-gray-800">
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle>Trade Signals</CardTitle>
          
          <div className="flex flex-col md:flex-row gap-3">
            <Input
              placeholder="Search symbols..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-[200px] bg-secondary"
            />
            
            <Select
              onValueChange={(value) => setFilter({...filter, types: value ? [value as 'BUY' | 'SELL'] : undefined})}
            >
              <SelectTrigger className="w-[120px] bg-secondary">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="BUY">Buy</SelectItem>
                <SelectItem value="SELL">Sell</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              onValueChange={(value) => setFilter({...filter, status: value ? [value as 'active' | 'executed' | 'cancelled' | 'completed'] : undefined})}
            >
              <SelectTrigger className="w-[120px] bg-secondary">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="executed">Executed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
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
                  <TableHead className="hidden md:table-cell">Entry Price</TableHead>
                  <TableHead className="hidden lg:table-cell">Targets</TableHead>
                  <TableHead className="hidden lg:table-cell">Stop Loss</TableHead>
                  <TableHead className="hidden md:table-cell">Confidence</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSignals.length > 0 ? (
                  filteredSignals.map((signal) => (
                    <TableRow key={signal.id} className="hover:bg-gray-800">
                      <TableCell className="font-medium">{signal.symbol}</TableCell>
                      <TableCell>
                        <Badge variant={signal.type === "BUY" ? "success" : "destructive"}>
                          {signal.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">${signal.entryPrice}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {signal.targets.map((target, i) => (
                          <span key={i} className="text-xs mr-1">
                            <span className="text-trading-neutral">T{i+1}:</span> ${target}
                          </span>
                        ))}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-trading-negative">${signal.stopLoss}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="w-full bg-gray-700 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full ${signal.confidence > 0.7 ? "bg-trading-positive" : "bg-trading-neutral"}`}
                            style={{ width: `${signal.confidence * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-400">{(signal.confidence * 100).toFixed(0)}%</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {signal.source === "strategy" ? (
                            <Badge variant="secondary" className="flex gap-1 items-center">
                              <Flag className="h-3 w-3" />
                              <span className="text-xs">Strategy</span>
                            </Badge>
                          ) : signal.source === "telegram" ? (
                            <Badge variant="outline" className="text-blue-400 border-blue-400/20 flex gap-1 items-center">
                              <Flag className="h-3 w-3" />
                              <span className="text-xs">Telegram</span>
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="flex gap-1 items-center">
                              <Flag className="h-3 w-3" />
                              <span className="text-xs">Manual</span>
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          signal.status === "active" ? "outline" :
                          signal.status === "executed" ? "secondary" :
                          signal.status === "completed" ? "success" : "destructive"
                        }>
                          {signal.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {signal.status === "active" && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleExecute(signal)}
                                className="text-trading-positive hover:text-white hover:bg-trading-positive"
                              >
                                <CheckIcon className="h-4 w-4 mr-1" />
                                <span className="sr-only md:not-sr-only md:text-xs">Execute</span>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleCancel(signal)}
                                className="text-trading-negative hover:text-white hover:bg-trading-negative"
                              >
                                <Cross2Icon className="h-4 w-4 mr-1" />
                                <span className="sr-only md:not-sr-only md:text-xs">Cancel</span>
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      No signals found.
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
}

export default SignalTable;
