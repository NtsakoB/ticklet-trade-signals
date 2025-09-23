import { apiFetch } from "@/lib/api";

export interface SignalGenerationResult {
  success: boolean;
  signals_generated: number;
  signals: any[];
  message: string;
  timestamp: string | null;
}

export interface SignalSystemStatus {
  status: string;
  database: string;
  active_signals: number;
  last_generation: string | null;
  binance_api?: string;
  error?: string;
}

export class LiveSignalsApi {
  /**
   * Generate live trading signals from current market conditions
   */
  static async generateSignals(): Promise<SignalGenerationResult> {
    try {
      const result = await apiFetch("/api/live-signals/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      return result;
    } catch (error) {
      console.error("Failed to generate live signals:", error);
      throw new Error(`Signal generation failed: ${error}`);
    }
  }

  /**
   * Get status of the signal generation system
   */
  static async getStatus(): Promise<SignalSystemStatus> {
    try {
      const result = await apiFetch("/api/live-signals/status");
      return result;
    } catch (error) {
      console.error("Failed to get signal system status:", error);
      return {
        status: "error",
        database: "error",
        active_signals: 0,
        last_generation: null,
        error: String(error),
      };
    }
  }

  /**
   * Manually cleanup expired signals
   */
  static async cleanupExpiredSignals(): Promise<{ success: boolean; cleaned_signals: number; message: string }> {
    try {
      const result = await apiFetch("/api/live-signals/cleanup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      return result;
    } catch (error) {
      console.error("Failed to cleanup expired signals:", error);
      throw new Error(`Signal cleanup failed: ${error}`);
    }
  }

  /**
   * Trigger edge function for scheduled signal generation
   */
  static async triggerScheduledGeneration(): Promise<any> {
    try {
      const supabaseUrl = "https://gjtetfgujpcyhjenudnb.supabase.co";
      const response = await fetch(`${supabaseUrl}/functions/v1/signal-scheduler`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqdGV0Zmd1anBjeWhqZW51ZG5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxMzQ5NjQsImV4cCI6MjA2NzcxMDk2NH0.RJddAD-2oCXMFaNCjBFMjqqGiwn21tfU3x8Kxgm9Y3s"}`,
        },
        body: JSON.stringify({ trigger: "manual" }),
      });

      if (!response.ok) {
        throw new Error(`Edge function responded with ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to trigger scheduled generation:", error);
      throw new Error(`Scheduled generation failed: ${error}`);
    }
  }
}