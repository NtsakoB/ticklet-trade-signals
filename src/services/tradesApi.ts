export type TradeItem = {
  id: string;
  symbol: string;
  side: "long" | "short" | "buy" | "sell";
  strategy?: string;
  pnl_abs?: number;
  pnl_pct?: number;
  time?: string;
  status?: string; // open/closed/filled
  leverage?: number;
};

export async function fetchTrades(params: { mode: "paper" | "live"; strategy?: string }): Promise<TradeItem[]> {
  const qs = new URLSearchParams(params as any).toString();
  const res = await fetch(`/api/trades?${qs}`, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`fetchTrades failed: ${res.status}`);
  return res.json();
}