import { API_BASE } from "@/config";
import { apiFetch } from "@/lib/api";

async function http(path: string, init: RequestInit = {}) {
  return apiFetch(path, init);
}

export const api = {
  health: () => http("/api/health"),
  chat: (message: string) => http("/api/chat", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  }),
  klines: (symbol: string, interval: string, limit = 200) =>
    http(`/api/market/klines?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&limit=${limit}`),
  symbols: () => http("/api/market/symbols"),
  settingsGet: () => http("/api/settings"),
  settingsPut: (payload: any) => http("/api/settings", {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
  }),
  generateSignal: () => http("/api/signals/generate", { method: "POST" }),
  paperOrder: (payload: any) => http("/api/paper/order", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
  }),
  paperState: () => http("/api/paper/state"),
  backtestRun: (symbol="BTCUSDT", interval="1h", bars=200) =>
    http(`/api/backtest/run?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&bars=${bars}`),
};