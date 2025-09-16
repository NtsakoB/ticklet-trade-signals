import { useEffect, useState } from "react";
import { api } from "@/integrations/api";

export function useMarketData() {
  const [connected, setConnected] = useState(false);
  const [symbols, setSymbols] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const s = await api.settingsGet(); // confirms preview=false
        const syms = await api.symbols();
        if (!cancelled) {
          setConnected(Boolean(s?.ok) && s?.preview === false);
          setSymbols(syms);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to connect");
      }
    }
    boot();
    return () => { cancelled = true; };
  }, []);

  return { connected, symbols, error };
}