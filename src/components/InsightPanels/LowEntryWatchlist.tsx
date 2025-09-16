import { apiFetch } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, Target, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

interface LowEntryOpportunity {
  symbol: string;
  current_price: number;
  projected_entry: number;
  status: string;
  commentary: string;
  ai_recommendation: {
    confidence: number;
    leverage: number;
    position_size_pct: number;
    timeframe: string;
  };
}

const fetchLowEntryWatchlist = async (): Promise<LowEntryOpportunity[]> => {
  return await apiFetch("/api/low-entry-watchlist");
};

export const LowEntryWatchlist = () => {
  const { data: watchlist, isLoading, refetch } = useQuery({
    queryKey: ["lowEntryWatchlist"],
    queryFn: fetchLowEntryWatchlist,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  useEffect(() => {
    const interval = setInterval(refetch, 30000);
    return () => clearInterval(interval);
  }, [refetch]);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Low Entry Watchlist
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-48">
            <div className="p-4 text-center text-muted-foreground">
              <div className="animate-pulse">Loading opportunities...</div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-4 w-4" />
          Low Entry Watchlist
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-48">
          {!watchlist || watchlist.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <div className="text-sm">No low entry opportunities found</div>
              <div className="mt-1 text-xs opacity-70">
                Monitoring for oversold conditions...
              </div>
            </div>
          ) : (
            <div className="space-y-2 p-3">
              {watchlist.map((opportunity) => (
                <div
                  key={opportunity.symbol}
                  className="p-3 rounded-lg border bg-card/50 hover:bg-card/80 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{opportunity.symbol}</span>
                      <Badge 
                        variant="secondary" 
                        className="text-xs"
                      >
                        {opportunity.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round(opportunity.ai_recommendation.confidence * 100)}% confidence
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    <div>
                      <span className="text-muted-foreground">Current: </span>
                      <span className="font-mono">{opportunity.current_price}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      <span className="text-muted-foreground">Entry: </span>
                      <span className="font-mono text-primary">{opportunity.projected_entry}</span>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground mb-2">
                    {opportunity.commentary}
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{opportunity.ai_recommendation.timeframe}</span>
                    </div>
                    <div className="text-muted-foreground">
                      {opportunity.ai_recommendation.leverage}x / {Math.round(opportunity.ai_recommendation.position_size_pct * 100)}% size
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};