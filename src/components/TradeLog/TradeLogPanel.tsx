import { useEffect, useState } from "react";
import { fetchTrades, TradeItem } from "@/services/tradesApi";
import { useStrategy } from "@/hooks/useStrategy";

export default function TradeLogPanel() {
  const { activeStrategy } = useStrategy();
  const [tab, setTab] = useState<"paper" | "live">("paper");
  const [data, setData] = useState<TradeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchTrades({ mode: tab, strategy: activeStrategy })
      .then((rows) => { if (alive) setData(rows); })
      .catch((error) => {
        console.error('Failed to fetch trades:', error);
        if (alive) setData([]);
      })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [tab, activeStrategy]);

  return (
    <div className="bg-card rounded-2xl p-4 border">
      <div className="flex items-center justify-between mb-3">
        <div className="text-lg font-semibold">Trade Log</div>
        <div className="flex gap-2">
          <button 
            className={`px-3 py-1 rounded-xl transition-colors ${
              tab === "paper" 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`} 
            onClick={() => setTab("paper")}
          >
            Paper
          </button>
          <button 
            className={`px-3 py-1 rounded-xl transition-colors ${
              tab === "live" 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`} 
            onClick={() => setTab("live")}
          >
            Live
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-xs text-muted-foreground px-2 pb-2 border-b">
        <div>Symbol</div>
        <div>Side</div>
        <div>Strategy</div>
        <div>Leverage</div>
        <div>PnL</div>
        <div>Time</div>
        <div>Status</div>
      </div>
      
      <div className="mt-2 max-h-96 overflow-auto rounded-lg">
        {loading ? (
          <div className="p-4 text-muted-foreground">Loading trades…</div>
        ) : data.length === 0 ? (
          <div className="p-4 text-muted-foreground">No trades found.</div>
        ) : (
          data.map((t) => (
            <div key={t.id} className="grid grid-cols-7 px-2 py-2 text-sm border-b border-border hover:bg-muted/50">
              <div className="font-mono">{t.symbol}</div>
              <div className={`capitalize ${
                t.side?.toLowerCase().includes('long') || t.side?.toLowerCase().includes('buy') 
                  ? 'text-green-500' 
                  : 'text-red-500'
              }`}>
                {t.side}
              </div>
              <div className="truncate">{t.strategy ?? "-"}</div>
              <div>{t.leverage ? `${t.leverage}x` : "-"}</div>
              <div className={`${(t.pnl_abs ?? 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                {typeof t.pnl_pct === "number" ? `${t.pnl_pct.toFixed(2)}%` : "-"}
              </div>
              <div className="text-xs text-muted-foreground">{t.time ?? "-"}</div>
              <div className={`text-xs ${
                t.status === 'open' ? 'text-yellow-400' : 
                t.status === 'closed' ? 'text-gray-400' : 
                'text-muted-foreground'
              }`}>
                {t.status ?? "-"}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}