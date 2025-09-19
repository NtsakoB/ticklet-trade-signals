export type BacktestSummary = {
  id: string;
  executed: number;
  wins: number;
  losses: number;
  win_rate: number;
  pnl_abs: number;
  pnl_pct: number;
  profit_factor: number;
  max_consecutive_wins: number;
  max_consecutive_losses: number;
  leverage_used: number;
  strategy: string;
  symbol: string;
  interval: string;
  data_points: number;
  timestamp: number;
  trade_count: number;
};

export type BacktestTrade = {
  id: string;
  symbol: string;
  strategy: string;
  side: string;
  leverage: number;
  entry_price: number;
  exit_price: number;
  pnl_abs: number;
  pnl_pct: number;
  win: boolean;
  confidence: number;
  ml_win_probability: number;
  exit_reason: string;
  hold_candles: number;
  timestamp: number;
  volume: number;
  signal_data: any;
};

export type BacktestResult = BacktestSummary & { 
  trades: BacktestTrade[];
};

export type BacktestParams = {
  strategy: string;
  symbol: string;
  interval: string;
  min_volume?: number;
  min_price_change_pct?: number;
  max_signals?: number;
  min_confidence?: number;
  start_time?: number;
  end_time?: number;
};

export async function runBacktest(params: BacktestParams): Promise<{id: string, summary: BacktestSummary}> {
  const res = await fetch("/api/backtest/run", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(params),
  });
  
  if (!res.ok) throw new Error(`runBacktest failed: ${res.status} ${res.statusText}`);
  
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  
  return data;
}

export async function getBacktestResult(id: string): Promise<BacktestResult> {
  const res = await fetch(`/api/backtest/result/${id}`, { 
    headers: { Accept: "application/json" }
  });
  
  if (!res.ok) throw new Error(`getBacktestResult failed: ${res.status} ${res.statusText}`);
  
  return res.json();
}

export async function listBacktestResults(): Promise<BacktestSummary[]> {
  const res = await fetch("/api/backtest/results", { 
    headers: { Accept: "application/json" }
  });
  
  if (!res.ok) throw new Error(`listBacktestResults failed: ${res.status} ${res.statusText}`);
  
  const data = await res.json();
  return data.results || [];
}