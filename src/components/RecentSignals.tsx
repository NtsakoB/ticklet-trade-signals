
import { TradeSignal } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { TakeProfitFormatter } from "@/utils/TakeProfitFormatter";

interface RecentSignalsProps {
  signals: TradeSignal[];
}

export function RecentSignals({ signals }: RecentSignalsProps) {
  return (
    <Card className="bg-trading-card border-gray-800 h-full">
      <CardHeader className="pb-3">
        <CardTitle>Recent Signals</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-96 overflow-y-auto p-6">
          <div className="space-y-4">
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
                      Anomaly: {signal.anomaly_score ?? 0}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Entry: {signal.entryPrice > 0 
                    ? `$${signal.entryPrice.toFixed(signal.entryPrice < 1 ? 6 : 4)}` 
                    : '—'} • Stop: {signal.stopLoss > 0 
                    ? `$${signal.stopLoss.toFixed(signal.stopLoss < 1 ? 6 : 4)}` 
                    : '—'}
                </p>
                {signal.targets && signal.targets.length > 0 && (() => {
                  const formattedSignal = TakeProfitFormatter.formatSignalOutput(signal);
                  return (
                    <p className="text-sm text-muted-foreground">
                      Targets: {formattedSignal.targets!.slice(0, 3).map((target, index) => (
                        <span key={index}>
                          T{index + 1}: ${target.toFixed(target < 1 ? 6 : 2)}
                          {index < Math.min(formattedSignal.targets!.length, 3) - 1 ? ' • ' : ''}
                        </span>
                      ))}
                    </p>
                  );
                })()}
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(signal.timestamp), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-muted-foreground">No recent signals</div>
        )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default RecentSignals;
