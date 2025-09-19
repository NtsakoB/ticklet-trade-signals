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

export async function fetchSignals(type: "trade" | "recent" | "low_entry" | "missed" | "low_price"): Promise<UISignal[]> {
  const res = await fetch(`/api/signals?type=${type}`, {
    headers: { Accept: "application/json" }
  });
  if (!res.ok) throw new Error(`fetchSignals failed: ${res.status}`);
  return res.json();
}