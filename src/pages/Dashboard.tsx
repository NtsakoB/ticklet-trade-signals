import React, { useEffect, useState } from "react";
import { api } from "@/integrations/api";
import { useMarketData } from "@/hooks/useMarketData";

export default function Dashboard() {
  const { connected, symbols, error } = useMarketData();
  const [candles, setCandles] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    if (connected) {
      (async () => {
        try {
          const [k, s] = await Promise.all([
            api.klines("BTCUSDT","1h",200), 
            api.settingsGet()
          ]);
          setCandles(k);
          setSettings(s);
        } catch (e: any) {
          console.error("Failed to load data:", e);
        }
      })();
    }
  }, [connected]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Ticklet Dashboard</h1>
        
        {/* Header status */}
        {connected ? (
          <p className="text-sm text-emerald-400 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" /> 
            Connected to Binance API (Real Data)
          </p>
        ) : error ? (
          <p className="text-sm text-red-400">Backend error: {error}</p>
        ) : (
          <p className="text-sm text-slate-400">Connecting…</p>
        )}
      </div>

      <div className="text-sm">
        {connected && candles.length > 0 && (
          <div>Loaded {candles.length} BTCUSDT bars · Volume filter {settings.volume_filter}</div>
        )}
        <div>Signals run server-side; charts via backend proxy.</div>
        {connected && symbols.length > 0 && (
          <div className="text-slate-400">Available symbols: {symbols.length}</div>
        )}
      </div>
    </div>
  );
}