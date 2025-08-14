import React, { useEffect, useState } from "react";
import { api } from "@/integrations/api";

export default function Dashboard() {
  const [status, setStatus] = useState("Loading…");
  const [candles, setCandles] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    (async () => {
      try {
        const [syms, k, s] = await Promise.all([
          api.symbols(), api.klines("BTCUSDT","1h",200), api.settingsGet()
        ]);
        setCandles(k); 
        setSettings(s); 
        setStatus(`Loaded ${k.length} bars · Volume filter ${s.volume_filter}`);
      } catch (e: any) { 
        setStatus(`Limited mode: ${e.message}`); 
      }
    })();
  }, []);

  return (
    <div className="p-6 space-y-2">
      <div className="text-xs rounded bg-amber-100 p-2">🔍 PREVIEW MODE – Live backend, no auth</div>
      <h1 className="text-2xl font-semibold">Ticklet Dashboard</h1>
      <div className="text-sm text-muted-foreground">{status}</div>
      <div className="text-sm">Signals run server-side; charts via backend proxy.</div>
    </div>
  );
}