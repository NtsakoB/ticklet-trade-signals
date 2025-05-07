
import { TradeSignal } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface RecentSignalsProps {
  signals: TradeSignal[];
}

export function RecentSignals({ signals }: RecentSignalsProps) {
  return (
    <Card className="bg-trading-card border-gray-800">
      <CardHeader className="pb-3">
        <CardTitle>Recent Signals</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        {signals.length > 0 ? (
          signals.map((signal) => (
            <div key={signal.id} className="flex items-start space-x-4">
              <div className={`mt-0.5 rounded-full p-1 ${signal.type === 'BUY' ? 'bg-trading-positive/20 text-trading-positive' : 'bg-trading-negative/20 text-trading-negative'}`}>
                <div className="h-2 w-2 rounded-full bg-current animate-pulse-slow" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={signal.type === "BUY" ? "success" : "destructive"}
                    className="px-1 text-xs font-semibold"
                  >
                    {signal.type}
                  </Badge>
                  <span className="font-semibold">{signal.symbol}</span>
                  {signal.anomaly && (
                    <Badge variant="outline" className="text-amber-400 border-amber-400/20">
                      Anomaly
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Entry: ${signal.entryPrice} • Stop: ${signal.stopLoss}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(signal.timestamp), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-muted-foreground">No recent signals</div>
        )}
      </CardContent>
    </Card>
  );
}

export default RecentSignals;
