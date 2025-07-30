import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';

interface TradeRecord {
  id: string;
  symbol: string;
  strategy: string;
  entry_price: number;
  pnl: number;
  confidence: number;
  trade_duration: number;
  tp1_hit: boolean;
  tp2_hit: boolean;
  tp3_hit: boolean;
  stop_loss_hit: boolean;
  created_at: string;
}

type SortField = 'symbol' | 'strategy' | 'pnl' | 'confidence' | 'trade_duration' | 'created_at';
type SortOrder = 'asc' | 'desc';

export default function TradeHistoryTable() {
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('trade_history_log')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrades(data || []);
    } catch (error) {
      console.error('Error fetching trades:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedTrades = [...trades].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const getOutcomeBadge = (trade: TradeRecord) => {
    if (trade.tp3_hit) return <Badge className="bg-green-600">TP3</Badge>;
    if (trade.tp2_hit) return <Badge className="bg-green-500">TP2</Badge>;
    if (trade.tp1_hit) return <Badge className="bg-green-400">TP1</Badge>;
    if (trade.stop_loss_hit) return <Badge variant="destructive">SL</Badge>;
    return <Badge variant="secondary">Open</Badge>;
  };

  const formatDuration = (minutes: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatPnL = (pnl: number) => {
    if (!pnl) return 'N/A';
    const isPositive = pnl > 0;
    return (
      <span className={isPositive ? 'text-green-400' : 'text-red-400'}>
        {isPositive ? '+' : ''}${pnl.toFixed(2)}
      </span>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trade History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading trade history...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trade History ({trades.length} trades)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('symbol')}
                    className="h-auto p-0 font-semibold"
                  >
                    Symbol {getSortIcon('symbol')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('strategy')}
                    className="h-auto p-0 font-semibold"
                  >
                    Strategy {getSortIcon('strategy')}
                  </Button>
                </TableHead>
                <TableHead>Entry Price</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('pnl')}
                    className="h-auto p-0 font-semibold"
                  >
                    PnL {getSortIcon('pnl')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('confidence')}
                    className="h-auto p-0 font-semibold"
                  >
                    Confidence {getSortIcon('confidence')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('trade_duration')}
                    className="h-auto p-0 font-semibold"
                  >
                    Duration {getSortIcon('trade_duration')}
                  </Button>
                </TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('created_at')}
                    className="h-auto p-0 font-semibold"
                  >
                    Date {getSortIcon('created_at')}
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTrades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No trades found
                  </TableCell>
                </TableRow>
              ) : (
                sortedTrades.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell className="font-medium">{trade.symbol}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{trade.strategy}</Badge>
                    </TableCell>
                    <TableCell>${trade.entry_price?.toFixed(4) || 'N/A'}</TableCell>
                    <TableCell>{formatPnL(trade.pnl)}</TableCell>
                    <TableCell>{trade.confidence ? `${(trade.confidence * 100).toFixed(1)}%` : 'N/A'}</TableCell>
                    <TableCell>{formatDuration(trade.trade_duration)}</TableCell>
                    <TableCell>{getOutcomeBadge(trade)}</TableCell>
                    <TableCell>
                      {format(new Date(trade.created_at), 'MMM dd, HH:mm')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}