import { apiFetch } from "@/lib/api";

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
  return apiFetch(`/api/signals?type=${type}`);
}