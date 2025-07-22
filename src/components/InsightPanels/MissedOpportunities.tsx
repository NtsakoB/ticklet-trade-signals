import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MissedOpportunity {
  symbol: string;
  pct_gain: number;
  rsi: number;
  price: number;
  note: string;
}

export const MissedOpportunities = () => {
  // Mock data - replace with actual API call to backend
  const missedOpportunities: MissedOpportunity[] = [
    { symbol: "BTCUSDT", pct_gain: 8.5, rsi: 78, price: 45000, note: "Overbought" },
    { symbol: "ETHUSDT", pct_gain: 12.3, rsi: 82, price: 3200, note: "Overbought" },
    { symbol: "ADAUSDT", pct_gain: 6.7, rsi: 76, price: 0.45, note: "Wait for dip" },
  ];

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
              <div className="animate-pulse">
                Awaiting signal logic...
              </div>
              <div className="mt-2 text-xs">
                Overbought pairs with high-risk entries will appear here
              </div>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};