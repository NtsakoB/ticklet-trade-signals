import { API_BASE } from "@/config";

async function http(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, { ...init, credentials: "omit" });
  if (!res.ok) throw new Error(`API ${res.status} ${res.statusText}`);
  return res.json();
}

export const api = {
  health: () => http("/health"),
  chat: (message: string) => http("/chat", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  }),
  klines: (symbol: string, interval: string, limit = 200) =>
    http(`/market/klines?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&limit=${limit}`),
  symbols: () => http("/market/symbols"),
  settingsGet: () => http("/settings"),
  settingsPut: (payload: any) => http("/settings", {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
  }),
  generateSignal: () => http("/signals/generate", { method: "POST" }),
  paperOrder: (payload: any) => http("/paper/order", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
  }),
  paperState: () => http("/paper/state"),
  backtestRun: (symbol="BTCUSDT", interval="1h", bars=200) =>
    http(`/backtest/run?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&bars=${bars}`),
};