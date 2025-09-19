import { apiFetch } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

interface MissedOpportunity {
  symbol: string;
  pct_gain: number;
  rsi: number;
  price: number;
  note: string;
}

export const MissedOpportunities = () => {
  const [missedOpportunities, setMissedOpportunities] = useState<MissedOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMissedOpportunities = async () => {
      try {
        setIsLoading(true);
        // Updated to match backend endpoint
        const data = await apiFetch('/api/signals?type=missed');
        setMissedOpportunities(data);
      } catch (error) {
        console.error('Failed to fetch missed opportunities:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMissedOpportunities();
    const interval = setInterval(fetchMissedOpportunities, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="h-full border-red-500/20">
      <CardHeader className="pb-2">
        <CardTitle>Missed Opportunities</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-48">
          {missedOpportunities.length > 0 ? (
            <div className="p-4 space-y-3">
              {missedOpportunities.map((opportunity) => (
                <div key={opportunity.symbol} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{opportunity.symbol}</div>
                    <div className="text-xs text-muted-foreground">
                      ${opportunity.price.toFixed(6)}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-500">+{opportunity.pct_gain}%</span>
                      <Badge variant="destructive" className="text-xs px-1">
                        RSI {opportunity.rsi}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">{opportunity.note}</div>
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
                  <div>No missed opportunities detected</div>
                  <div className="mt-2 text-xs">
                    Real-time RSI and price analysis active
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