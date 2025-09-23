export type SignalType = "active"|"recent"|"missed"|"low_entry"|"lowest";

export interface SignalItem { 
  symbol: string; 
  side?: "BUY"|"SELL"; 
  entry?: number; 
  stop?: number; 
  targets?: number[]; 
  ai_commentary?: string; 
  ml_confidence?: number; 
  strategy?: string; 
  status?: string; 
  created_at?: string; 
  [k:string]: any; 
}

export interface SignalsResponse { 
  title: string; 
  items: SignalItem[]; 
}

// Legacy interface aliases for backward compatibility
export type UnifiedSignal = SignalItem;

export async function fetchSignals(type: SignalType, limit=50): Promise<SignalsResponse> {
  const res = await fetch(`/api/signals?type=${type}&limit=${limit}`);
  if (!res.ok) throw new Error(`Failed to fetch ${type}`);
  return res.json();
}

// Legacy class for backward compatibility
export class SignalsService {
  static async fetchSignals(type: SignalType): Promise<UnifiedSignal[]> {
    const response = await fetchSignals(type);
    return response.items;
  }

  static async generateSignal(): Promise<{ emitted: string[]; missed: string[]; checked: number; timestamp: number; }> {
    const res = await fetch('/api/signals/generate', { method: 'POST', credentials: 'include' });
    if (!res.ok) throw new Error(`signals/generate HTTP ${res.status}`);
    return res.json();
  }

  static async getDashboardStats(): Promise<{
    active_signals: number;
    executed_trades: number;
    win_rate: number;
    capital_at_risk: number;
    total_balance: number;
    starting_balance: number;
    performance_history: Array<{ date: string; balance: number; win_rate: number; trades_count: number; }>;
    last_updated: string;
  }> {
    const res = await fetch('/api/summary/dashboard', { credentials: 'include' });
    if (!res.ok) throw new Error(`summary/dashboard HTTP ${res.status}`);
    return res.json();
  }
}