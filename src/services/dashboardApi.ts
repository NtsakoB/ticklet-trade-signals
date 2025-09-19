/**
 * Dashboard summary API service
 */

export interface DashboardSummaryData {
  active_signals: number;
  executed_trades: number;
  win_rate: number;
  capital_at_risk: number;
  data_source: 'supabase' | 'csv_fallback' | 'mock_data';
}

export async function fetchDashboardSummary(): Promise<DashboardSummaryData> {
  try {
    const res = await fetch('/api/summary/dashboard', {
      headers: { 
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!res.ok) {
      throw new Error(`Dashboard summary fetch failed: ${res.status} ${res.statusText}`);
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch dashboard summary:', error);
    
    // Return fallback data
    return {
      active_signals: 3,
      executed_trades: 15,
      win_rate: 0.6,
      capital_at_risk: 8500.0,
      data_source: 'mock_data'
    };
  }
}