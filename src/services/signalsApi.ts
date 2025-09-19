export type UISignal = {
  id: string;
  symbol: string;
  title?: string;
  subtitle?: string;
  confidence?: number;
  price?: number;
  change_pct?: number;
  time?: string;
  tags?: string[];
};

export async function fetchSignals(type: "active" | "recent" | "missed" | "lowest"): Promise<UISignal[]> {
  const res = await fetch(`/api/signals?type=${type}`, {
    headers: { Accept: "application/json" }
  });
  if (!res.ok) throw new Error(`fetchSignals failed: ${res.status}`);
  return res.json();
}

// Backward compatibility function for old types
export async function fetchSignalsCompat(type: "trade" | "low_entry" | "low_price"): Promise<UISignal[]> {
  const res = await fetch(`/api/signals/compat?type=${type}`, {
    headers: { Accept: "application/json" }
  });
  if (!res.ok) throw new Error(`fetchSignalsCompat failed: ${res.status}`);
  return res.json();
}