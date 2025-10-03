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

function toArray<T = any>(val: any): T[] {
  return Array.isArray(val) ? val : [];
}

export async function fetchSignals(type: SignalType, limit = 50): Promise<SignalsResponse> {
  try {
    const res = await fetch(`/api/signals?type=${type}&limit=${limit}`, { credentials: "include" });
    if (!res.ok) return { title: "", items: [] };
    const json = await res.json();
    // Be forgiving about backend shape
    const title = typeof json?.title === "string" ? json.title : "";
    const items = toArray<SignalItem>(json?.items ?? json);
    return { title, items };
  } catch {
    return { title: "", items: [] };
  }
}

// Legacy class for backward compatibility
export class SignalsService {
  static async fetchSignals(type: SignalType): Promise<UnifiedSignal[]> {
    const response = await fetchSignals(type);
    return response.items;
  }

  static async generateSignal(): Promise<{
    emitted: string[];
    missed: string[];
    checked: number;
    timestamp: number;
  }> {
    try {
      const response = await fetch("/api/signals/generate", {
        method: "POST",
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Extract emitted and missed symbols from the generated signals
      const emitted = data.signals?.map((s: any) => s.symbol) || [];
      const missed = [];  // Backend doesn't track missed in generate endpoint
      
      return {
        emitted: emitted,
        missed: missed,
        checked: data.count || 0,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("Error generating signals:", error);
      throw error;
    }
  }

  static async getDashboardStats(): Promise<{
    active_signals: number;
    executed_trades: number;
    win_rate: number;
    capital_at_risk: number;
    total_balance: number;
    starting_balance: number;
    performance_history: Array<{
      timestamp: string;
      balance: number;
      trades_count: number;
      win_rate: number;
    }>;
    last_updated: string;
  }> {
    try {
      const response = await fetch("/api/summary/dashboard", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Provide safe defaults for all fields
      return {
        active_signals: data.active_signals || 0,
        executed_trades: data.executed_trades || 0,
        win_rate: data.win_rate || 0,
        capital_at_risk: data.capital_at_risk || 0,
        total_balance: data.total_balance || 10000,
        starting_balance: data.starting_balance || 10000,
        performance_history: Array.isArray(data.performance_history) 
          ? data.performance_history 
          : [],
        last_updated: data.last_updated || new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      // Return safe defaults on error
      return {
        active_signals: 0,
        executed_trades: 0,
        win_rate: 0,
        capital_at_risk: 0,
        total_balance: 10000,
        starting_balance: 10000,
        performance_history: [],
        last_updated: new Date().toISOString(),
      };
    }
  }
}