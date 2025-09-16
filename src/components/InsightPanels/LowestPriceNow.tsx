import { apiFetch } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

interface LowestPriceData {
  symbol: string;
  current_price: number;
  lookback_low: number;
  pct_from_low: number;
  score: number;
  commentary: string;
}

export const LowestPriceNow = () => {
  const [lowestPriceData, setLowestPriceData] = useState<LowestPriceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLowestPriceData = async () => {
      try {
        setIsLoading(true);
        // Replace with actual API endpoint when backend is ready
        const data = await apiFetch('/api/lowest-price');
        setLowestPriceData(data);
      } catch (error) {
        console.error('Failed to fetch lowest price data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLowestPriceData();
    const interval = setInterval(fetchLowestPriceData, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="h-full border-green-500/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-green-400">
          <ArrowDown className="h-4 w-4" />
          Lowest Price
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-48">
          {lowestPriceData.length > 0 ? (
            <div className="space-y-2 p-4">
              {lowestPriceData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded border border-green-500/20 bg-green-500/5">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.symbol}</div>
                    <div className="text-xs text-muted-foreground">{item.commentary}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">${item.current_price}</div>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs">
                        {item.pct_from_low}%
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {(item.score * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              {isLoading ? (
                <div className="animate-pulse">
                  Loading live market data...
                </div>
              ) : (
                <div>
                  <div>No symbols near lowest price detected</div>
                  <div className="mt-2 text-xs">
                    Real-time price analysis active
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};