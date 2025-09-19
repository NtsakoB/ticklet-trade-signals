export interface UnifiedSignal {
  id: string;
  symbol: string;
  title: string;
  subtitle: string;
  confidence: number;   // integer 0..100
  price: number;
  change_pct: number;
  time: string;
  tags: string[];
  entry_low: number;
  entry_high: number;
  stop_loss: number;
  targets: number[];
  rr_ratio: number;
  volume: number;
  raw_data?: any;
}

export type SignalType = 'active' | 'recent' | 'missed' | 'lowest' | 'trade' | 'low_entry' | 'low_price';

const BASE = '/api';

export class SignalsService {
  static async fetchSignals(type: SignalType): Promise<UnifiedSignal[]> {
    const res = await fetch(`${BASE}/signals?type=${type}`, { credentials: 'include' });
    if (!res.ok) throw new Error(`signals(${type}) HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }

  static async generateSignal(): Promise<{ emitted: string[]; missed: string[]; checked: number; timestamp: number; }> {
    const res = await fetch(`${BASE}/signals/generate`, { method: 'POST', credentials: 'include' });
    if (!res.ok) throw new Error(`signals/generate HTTP ${res.status}`);
    return res.json();
  }

  static async getDashboardStats(): Promise<{
    active_signals: number;
    executed_trades: number;
    win_rate: number; // 0..1
    capital_at_risk: number;
    total_balance: number;
    starting_balance: number;
    performance_history: Array<{ date: string; balance: number; win_rate: number; trades_count: number; }>;
    last_updated: string;
  }> {
    const res = await fetch(`${BASE}/summary/dashboard`, { credentials: 'include' });
    if (!res.ok) throw new Error(`summary/dashboard HTTP ${res.status}`);
    return res.json();
  }
}