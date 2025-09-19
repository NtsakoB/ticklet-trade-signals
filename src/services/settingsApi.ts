export type TradingSettings = {
  dynamic_leverage_enabled: boolean;
  manual_leverage: number; // 1..20
};

export async function getTradingSettings(): Promise<TradingSettings> {
  const res = await fetch("/api/settings/trading", { headers: { Accept: "application/json" }});
  if (!res.ok) throw new Error(`getTradingSettings failed: ${res.status}`);
  return res.json();
}

export async function updateTradingSettings(payload: TradingSettings): Promise<TradingSettings> {
  const res = await fetch("/api/settings/trading", {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`updateTradingSettings failed: ${res.status}`);
  return res.json();
}